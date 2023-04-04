'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Data
const account1 = {
  owner: 'Jonas Schmedtmann',
  currency: 'EUR',
  movements: [ 200, 450, -400, 3000, -650, -130, 70, 1300 ],
  movementsDates: [
    '2019-01-28T09:15:04.904Z',
    '2019-04-01T10:17:24.185Z',
    '2020-05-27T17:01:17.194Z',
    '2020-07-11T23:36:17.929Z',
    '2021-11-18T21:31:17.178Z',
    '2022-12-23T07:42:02.383Z',
    '2022-03-08T14:11:59.604Z',
    '2023-03-12T10:51:36.790Z'
  ],
  interestRate: 1.2, // %
  pin: 1111,
};

const account2 = {
  owner: 'Jessica Davis',
  currency: 'USD',
  movements: [ 5000, 3400, -150, -790, -3210, -1000, 8500, -30 ],
  movementsDates: [
    '2022-01-25T14:18:46.235Z',
    '2022-02-05T16:33:06.386Z',
    '2022-03-10T14:43:26.374Z',
    '2022-04-25T18:49:59.371Z',
    '2022-11-01T13:15:33.035Z',
    '2022-11-30T09:48:16.867Z',
    '2022-12-25T06:04:23.907Z',
    '2023-02-26T12:01:20.894Z',
  ],
  interestRate: 1.5,
  pin: 2222,
};

const account3 = {
  owner: 'Steven Thomas Williams',
  currency: 'GBP',
  movements: [ 200, -200, 340, -300, -20, 50, 400, -460 ],
  movementsDates: [
    '2018-06-20T18:49:59.371Z',
    '2018-09-10T13:15:33.035Z',
    '2019-07-22T09:48:16.867Z',
    '2019-08-19T06:04:23.907Z',
    '2020-04-25T12:01:20.894Z',
    '2021-07-09T12:01:20.894Z',
    '2022-01-20T12:01:20.894Z',
    '2023-03-17T12:01:20.894Z',
  ],
  interestRate: 0.7,
  pin: 3333,
};

const account4 = {
  owner: 'Sarah Smith',
  currency: 'UAH',
  movements: [ 430, 1000, 700, 50, 90 ],
  movementsDates: [
    '2022-06-02T18:49:59.371Z',
    '2022-09-01T13:15:33.035Z',
    '2023-10-23T09:48:16.867Z',
    '2023-12-26T06:04:23.907Z',
    '2023-02-21T12:01:20.894Z',
  ],
  interestRate: 1,
  pin: 4444,
};

const accounts = [ account1, account2, account3, account4 ];

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
const currencies = new Map([
  [ 'EUR', '€' ],
  [ 'USD', '$' ],
  [ 'GBP', '£' ],
  [ 'UAH', '₴' ],
]);
let logOutTimerId, sortMovementsBounded, transferMoneyBounded,
  requestLoanBounded, closeAccountBounded;

const formatNumberForEuro = num => num.toFixed(2).replace('.', ',');
const formatNumberBelowTen = num => num >= 10 ? num : `0${ num }`;
const resetForm = formClass => document.getElementsByClassName(
  formClass)[0].reset();

const createUsernames = accs => {
  accs.forEach(acc => {
    acc.login = acc.owner.
      toLowerCase().
      split(' ').
      map(word => word.at(0)).
      join('');
  });
};

const validateAndGetUser = () => {
  let isValid = false;
  let validUser;

  const inputLogin = inputLoginUsername.value.trim().toLowerCase();
  const inputPin = inputLoginPin.value.trim().toLowerCase();

  for (const account of accounts) {
    const { pin, login } = account;
    if (login !== inputLogin && pin !== +inputPin) continue;

    isValid = true;
    validUser = account;
    break;
  }

  resetForm('login');
  return { isValid, validUser };
};

const renderWelcomeMessage = (userName) => {
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

const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = formatNumberBelowTen(date.getMonth() + 1);
  const day = formatNumberBelowTen(date.getDate());
  const time = `${ date.getHours() }:${ formatNumberBelowTen(
    date.getMinutes()) }`;

  return `${ day }/${ month }/${ year }, ${ time }`;
};

const renderUIComponent = (selectorOrElement, content) => {
  if (typeof selectorOrElement === 'string') {
    document.querySelector(
      selectorOrElement).innerHTML = content;
  } else {
    selectorOrElement.innerHTML = content;
  }
};

const renderBalance = (user, currencySign) => {
  labelBalance.textContent = `${ formatNumberForEuro(user.movements.reduce(
    (acc, curr) => acc + curr)) } ${ currencySign }`;
};

const formatMovementDate = (date) => {
  return date?.slice(0, date?.
      indexOf('T'))?.
      split('-')?.
      reverse()?.
      join('/')
    ||
    getCurrentDate().
      slice(0, 11);
};

const renderMovements = (user, currencySign) => {
  containerMovements.innerHTML = '';
  const { movements, movementsDates } = user;

  movements.forEach((movement, i) => {
    const moveEl = document.createElement('div');
    const depositClass = movement >= 0 ? 'deposit' : 'withdrawal';
    const depositType = depositClass.slice(depositClass.lastIndexOf('-') + 1);
    const currMovementDate = formatMovementDate(movementsDates[i]);

    moveEl.classList.add('movements__row');
    moveEl.innerHTML = `
          <div class='movements__type movements__type--${ depositClass } '>
            ${ i + 1 } ${ depositType }
          </div>
          <div class='movements__date'>${ currMovementDate }</div>
          <div class='movements__value'>
            ${ formatNumberForEuro(movement) } ${ currencySign }
          </div>
    `;

    containerMovements.prepend(moveEl);
  });
};

const renderSummary = (user, currencySign) => {
  const { movements, interestRate } = user;

  const summIn = movements.filter(e => e >= 0);
  const summOut = movements.filter(e => e < 0);

  const interestSum = summIn.reduce((prev, curr) => prev + curr) *
    (interestRate / 100);

  [
    [ labelSumIn, summIn ],
    [ labelSumOut, summOut ],
  ].forEach(([ label, summ ]) => {
    const calculatedSumm = summ.reduce((curr, prev) => curr + prev, 0);

    label.textContent = `${ formatNumberForEuro(
      Math.abs(calculatedSumm)) } ${ currencySign }`;
  });

  labelSumInterest.textContent = `${ formatNumberForEuro(
    interestSum) } ${ currencySign }`;
};

const sortMovements = (user, currencySign) => {
  const { movements } = user;

  for (let i = movements.length; i > 0; --i) {
    if (!(movements.at(i + 1) < movements.at(i))) continue;

    movements.sort((prev, curr) => prev - curr);
    return renderMovements(user, currencySign);
  }

  movements.sort((prev, curr) => prev + curr);
  renderMovements(user, currencySign);
};

const setLogOutTimer = () => {
  let minutes = 10;
  let seconds = 0;

  const renderTimer = () => {
    labelTimer.textContent = `${ formatNumberBelowTen(
      minutes) }:${ formatNumberBelowTen(seconds) }`;
  };
  renderTimer();

  logOutTimerId = setInterval(() => {
    seconds && seconds--;

    if (minutes === 0 && seconds === 0) {
      logOutUser();
      clearTimeout(logOutTimerId);
    } else if (seconds === 0) {
      seconds = 59;
      minutes && minutes--;
    }

    renderTimer();
  }, 1000);

  return logOutTimerId;
};

const transferMoney = (user, currUserCurrencySign, event) => {
  event.preventDefault();

  const { movements } = user;
  const transferTo = inputTransferTo.value;
  const transferAmount = +inputTransferAmount.value;
  const currUserMovements = movements;
  resetForm('form--transfer');

  for (const { login, movements: recipientMovements } of accounts) {
    if (login !== transferTo) continue;

    currUserMovements.push(-transferAmount);
    recipientMovements.push(transferAmount);
    renderMovementsSummaryAndBalance(user, currUserCurrencySign);
    return;
  }
};

const renderMovementsSummaryAndBalance = (user, currencySign) => {
  [ renderMovements, renderSummary, renderBalance ].forEach(
    func => func(user, currencySign));
};

const requestLoan = (user, currencySign, event) => {
  event.preventDefault();

  const amount = +inputLoanAmount.value;
  const { movements } = user;
  inputLoanAmount.value = '';

  if (
    !(movements.some(
      move => move > (amount * 10) / 100) && amount > 0)
  ) return;
  setTimeout(() => {
    movements.push(amount);
    renderMovementsSummaryAndBalance(user, currencySign);
  }, Math.trunc(((Math.random() * 2) + 1) * 1000));
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
    logOutUser();
    break;
  }
};

const initializeApp = (user, currencySign) => {
  const { owner } = user;
  containerApp.style.opacity = '100%';

  setLogOutTimer();
  renderWelcomeMessage(owner);
  [ renderBalance, renderMovements, renderSummary ].forEach(
    func => func(user, currencySign));
};

btnLogin.addEventListener('click', event => {
  event.preventDefault();
  logOutTimerId && clearInterval(logOutTimerId);
  createUsernames(accounts);

  const {
    isValid,
    validUser,
    validUser: {
      currency
    }
  } = validateAndGetUser();
  if (!isValid) return;

  const currencySign = currencies.get(currency);
  renderUIComponent(labelDate, getCurrentDate());
  initializeApp(validUser, currencySign);

  sortMovementsBounded = sortMovements.bind(null, validUser, currencySign);
  transferMoneyBounded = transferMoney.bind(null, validUser, currencySign);
  requestLoanBounded = requestLoan.bind(null, validUser, currencySign);
  closeAccountBounded = closeAccount.bind(null, validUser);
});

btnSort.addEventListener('click', () => sortMovementsBounded());
btnTransfer.addEventListener('click', event => transferMoneyBounded(event));
btnLoan.addEventListener('click', event => requestLoanBounded(event));
btnClose.addEventListener('click', event => closeAccountBounded(event));