'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Data
const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [ 200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300 ],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2021-11-18T21:31:17.178Z',
    '2021-12-23T07:42:02.383Z',
    '2022-01-28T09:15:04.904Z',
    '2022-04-01T10:17:24.185Z',
    '2022-05-08T14:11:59.604Z',
    '2023-04-12T17:01:17.194Z',
    '2023-04-14T23:36:17.929Z',
    '2023-04-17T10:51:36.790Z'
  ],
  currency: 'EUR',
  locale: 'pt-PT' // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [ 5000, 3400, -150, -790, -3210, -1000, 8500, -30 ],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z'
  ],
  currency: 'USD',
  locale: 'en-US'
};

const accounts = [ account1, account2 ];

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

// App
const dateFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric'
};

let logOutTimerId, sortMovementsBounded,
  transferMoneyBounded, requestLoanBounded,
  closeAccountBounded, sorted = false;

(() => {
  accounts.forEach(acc => {
    acc.login = acc.owner.
      toLowerCase().
      split(' ').
      map(word => word.at(0)).
      join('');
  });
})();

const formatNumber = (num, currency, locale) => {
  const numFormatOptions = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  });

  return numFormatOptions.format(num);
};
const padZero = num => `${ num }`.padStart(2, 0);
const resetAllForms = () => {
  document.querySelectorAll('input').forEach(input => input.blur());
  document.querySelectorAll('form').forEach(form => form.reset());
};

const validateAndGetUser = () => {
  let isValid = false;
  let validUser;

  const inputLogin = inputLoginUsername.value.trim().toLowerCase();
  const inputPin = inputLoginPin.value.trim();

  for (const account of accounts) {
    const { pin, login } = account;
    if (login !== inputLogin || pin !== +inputPin) continue;

    isValid = true;
    validUser = account;
    break;
  }

  return { isValid, validUser };
};

const renderWelcomeMessage = userName => {
  const hours = new Date().getHours();
  let message = 'Good ';

  message +=
    hours >= 23 && hours < 12
      ? 'Morning'
      : hours >= 12 && hours < 18
        ? 'Day'
        : hours >= 18 && hours < 21
          ? 'Afternoon'
          : hours >= 21 && hours < 23
            ? 'Evening'
            : 'Night';

  labelWelcome.textContent = `${ message }, ${ userName.slice(0,
    userName.indexOf(' ')) }!`;
};

const logOutUser = () => {
  containerApp.style.opacity = '0';
  labelWelcome.textContent = 'Log in to get started';
};

const createDate = (date = new Date(), locale) => {
  const currDate = new Date(date);
  const calcDaysPassed = (date1, date2) => Math.round(Math.abs(
    (date2 - date1) / (1000 * 60 * 60 * 24)
  ));

  const daysPassed = calcDaysPassed(new Date(), currDate);

  if (daysPassed === 0) return 'Today';
  if (daysPassed === 1) return 'Yesterday';
  if (daysPassed <= 7) return `${ daysPassed } days ago`;

  return new Intl.DateTimeFormat(locale).format(currDate);
};

const renderBalance = user => {
  const { currency, locale, movements } = user;
  const balance = movements.reduce(
    (acc, curr) => acc + curr
  );
  labelBalance.textContent = `${ formatNumber(balance, currency, locale) }`;

  user.balance = balance;
};

const renderMovements = (
  {
    movements,
    movementsDates,
    locale,
    currency: userCurrency
  },
  sort = false
) => {
  containerMovements.innerHTML = '';

  const movs = sort ? [ ...movements ].sort((a, b) => a - b) : movements;

  movs.forEach((movement, i) => {
    const moveEl = document.createElement('div');
    const depositClass = movement < 0 ? 'withdrawal' : 'deposit';
    const movDate = createDate(movementsDates[i], locale);
    const formattedMov = formatNumber(movement, userCurrency, locale);

    moveEl.classList.add('movements__row');
    moveEl.innerHTML = `
          <div class='movements__type movements__type--${ depositClass } '>
            ${ i + 1 } ${ depositClass }
          </div>
          <div class='movements__date'>${ movDate }</div>
          <div class='movements__value'>${ formattedMov }</div>
    `;

    containerMovements.prepend(moveEl);
  });
};

const renderSummary = ({ movements, interestRate, currency, locale }) => {
  const summIn = movements.filter(e => e >= 0);
  const summOut = movements.filter(e => e < 0);

  const interestSum = Math.floor(summIn.reduce((prev, curr) => prev + curr) *
    (interestRate / 100));

  [
    [ labelSumIn, summIn ],
    [ labelSumOut, summOut ]
  ].forEach(([ label, summ ]) => {
    const calculatedSumm = summ.reduce((curr, prev) => curr + prev, 0);

    label.textContent = `${ formatNumber(Math.floor(
      Math.abs(calculatedSumm)), currency, locale) }`;
  });

  labelSumInterest.textContent = `${ formatNumber(interestSum, currency,
    locale) }`;
};

const setLogOutTimer = () => {
  logOutTimerId && clearInterval(logOutTimerId);

  let limit = 600;

  const renderTimer = limit => {
    const min = Math.floor(limit / 60);
    const sec = Math.floor(limit % 60);
    labelTimer.textContent = `${ padZero(min) }:${ padZero(sec) }`;
  };
  renderTimer(limit);

  logOutTimerId = setInterval(() => {
    if (limit > 0) return renderTimer(--limit);

    logOutUser();
    clearInterval(logOutTimerId);
  }, 1000);

  return logOutTimerId;
};

const transferMoney = (user, event) => {
  event.preventDefault();
  setLogOutTimer();

  const {
    movements: currUserMovements,
    balance: currUserBalance,
    movementsDates: currUserMovDates,
    username: currUser
  } = user;
  const recipient = inputTransferTo.value;
  const transferAmount = +inputTransferAmount.value;

  if (
    transferAmount <= 0
    || transferAmount > currUserBalance
    || recipient === currUser
  ) return;

  for (const {
    login,
    movements: recipientMovements,
    movementsDates: recipientMovDates
  } of accounts) {
    if (login !== recipient) continue;

    currUserMovements.push(-transferAmount);
    currUserMovDates.push(new Date().toISOString());

    recipientMovements.push(transferAmount);
    recipientMovDates.push(new Date().toISOString());
    rerenderUI(user);
    return;
  }
};

const rerenderUI = (user, resetForms = true) => {
  [ renderMovements, renderSummary, renderBalance ].forEach(
    func => func(user)
  );
  if (resetForms) resetAllForms();
};

const requestLoan = (user, event) => {
  event.preventDefault();
  setLogOutTimer();

  const amount = Math.floor(inputLoanAmount.value);
  const { movements, movementsDates } = user;

  if (
    !(movements.some(
        move => move >= amount * 0.1
      )
      && amount > 0)
  ) {
    return resetAllForms();
  }

  setTimeout(() => {
    movements.push(amount);
    movementsDates.push(new Date().toISOString());
    rerenderUI(user, false);
  }, Math.trunc(((Math.random() * 2) + 1) * 1000));

  resetAllForms();
};

const closeAccount = (user, event) => {
  event.preventDefault();

  const { login, pin } = user;
  const inputLogin = inputCloseUsername.value;
  const inputPin = +inputClosePin.value;
  [ inputCloseUsername, inputClosePin ].forEach(e => e.value = '');

  if (inputLogin !== login || inputPin !== pin) return;

  for (const account of accounts) {
    if (account !== user) continue;
    accounts.splice(accounts.indexOf(user), 1);
    return logOutUser();
  }
};

const initializeApp = user => {
  const now = new Date();
  const { owner, locale } = user;
  containerApp.style.opacity = '100%';
  labelDate.textContent = new Intl.DateTimeFormat(locale,
    dateFormatOptions).format(now);

  setLogOutTimer();
  renderWelcomeMessage(owner);
  rerenderUI(user);
};

btnLogin.addEventListener('click', event => {
  event.preventDefault();

  const { isValid, validUser } = validateAndGetUser();
  if (!isValid) return;

  initializeApp(validUser);

  [
    sortMovementsBounded,
    transferMoneyBounded,
    requestLoanBounded,
    closeAccountBounded
  ] = [
    renderMovements,
    transferMoney,
    requestLoan,
    closeAccount
  ].map(func => func.bind(null, validUser));
});

btnSort.addEventListener('click', () => {
  sortMovementsBounded(!sorted);
  sorted = !sorted;
});
btnTransfer.addEventListener('click', event => transferMoneyBounded(event));
btnLoan.addEventListener('click', event => requestLoanBounded(event));
btnClose.addEventListener('click', event => closeAccountBounded(event));