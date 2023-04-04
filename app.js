'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Data
const account1 = {
  login: 'js',
  owner: 'Jonas Schmedtmann',
  currency: 'EUR',
  movements: [ 200, 450, -400, 3000, -650, -130, 70, 1300 ],
  interestRate: 1.2, // %
  pin: 1111,
};

const account2 = {
  login: 'jd',
  owner: 'Jessica Davis',
  currency: 'USD',
  movements: [ 5000, 3400, -150, -790, -3210, -1000, 8500, -30 ],
  interestRate: 1.5,
  pin: 2222,
};

const account3 = {
  owner: 'Steven Thomas Williams',
  movements: [ 200, -200, 340, -300, -20, 50, 400, -460 ],
  interestRate: 0.7,
  pin: 3333,
};

const account4 = {
  owner: 'Sarah Smith',
  movements: [ 430, 1000, 700, 50, 90 ],
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

let logOutTimerId;

// App
const currencies = new Map([
  [ 'EUR', '€' ],
  [ 'USD', '$' ]
]);

const formatNumberForEuro = (num) => num.toFixed(2).replace('.', ',');
const formatNumberBelowTen = (num) => num >= 10 ? num : `0${ num }`;

const validateAndGetUser = () => {
  let isValid = false;
  let validUser;

  const [ inputLogin, inputPin ] = [
    inputLoginUsername,
    inputLoginPin ].map(
    elem => elem.value.trim().toLowerCase());

  for (const account of accounts) {
    const { pin, login } = account;

    if (login === inputLogin && pin === +inputPin) {
      isValid = true;
      validUser = account;
      break;
    }
  }

  document.querySelector('.login').reset();
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

  return labelWelcome.textContent = `${ message }, ${ userName.slice(0,
    userName.indexOf(' ')) }!`;
};

const renderGettingStartedMessage = () => {
  labelWelcome.textContent = 'Log in to get started';
};

const getCurrentDate = () => {
  const date = new Date();
  const time = `${ date.getHours() }:${ formatNumberBelowTen(
    date.getMinutes()) }`;
  const day = formatNumberBelowTen(date.getDate());
  const month = formatNumberBelowTen(date.getMonth() + 1);

  return `${ day }/${ month }/${ date.getFullYear() }, ${ time }`;
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
    (curr, prev) => curr + prev)) } ${ currencySign }`;
};

const renderMovements = (movements, currencySign) => {
  containerMovements.innerHTML = '';

  movements.forEach((movement, i) => {
    const moveEl = document.createElement('div');
    const depositClass = movement >= 0
      ? 'movements__type--deposit'
      : 'movements__type--withdrawal';
    const depositType = depositClass.slice(depositClass.lastIndexOf('-') + 1);
    const moveDate = getCurrentDate().
      slice(0, getCurrentDate().indexOf(','));

    moveEl.classList.add('movements__row');
    moveEl.innerHTML = `
          <div class='movements__type ${ depositClass } '>
            ${ i + 1 } ${ depositType }
          </div>
          <div class='movements__date'>${ moveDate }</div>
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
    const calculatedSumm = summ.reduce((curr, prev) => curr + prev);

    label.textContent = `${ formatNumberForEuro(
      Math.abs(calculatedSumm)) } ${ currencySign }`;
  });

  labelSumInterest.textContent = `${ formatNumberForEuro(
    interestSum) } ${ currencySign }`;
};

const sortMovements = (movements, currencySign) => {
  for (let i = 1; i < movements.length; i++) {
    if (movements.at(i - 1) > movements.at(i)) {
      return renderMovements(movements.sort((prev, curr) => prev - curr),
        currencySign);
    }
  }

  return renderMovements(movements.sort((prev, curr) => prev + curr),
    currencySign);
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
      containerApp.style.opacity = '0';
      renderGettingStartedMessage();
      clearTimeout(logOutTimerId);
    } else if (seconds === 0) {
      seconds = 59;
      minutes && minutes--;
    }

    renderTimer();
  }, 1000);

  return logOutTimerId;
};

const transferMoney = (user, event, currUserCurrencySign) => {
  event.preventDefault();

  const { movements } = user;
  const transferTo = inputTransferTo.value;
  const transferAmount = +inputTransferAmount.value;
  const currUserMovements = movements;
  document.getElementsByClassName('form--transfer')[0].reset();

  for (const { login, movements: recipientMovements } of accounts) {
    if (login === transferTo) {
      currUserMovements.push(-transferAmount);
      recipientMovements.push(transferAmount);
      renderMovements(movements, currUserCurrencySign);
      renderSummary(user, currUserCurrencySign);
      renderBalance(user, currUserCurrencySign);
      return;
    }
  }
};

const requestLoan = (user, event, currencySign) => {
  event.preventDefault();
  const amount = +inputLoanAmount.value;
  inputLoanAmount.value = '';
  const { movements } = user;

  if (movements.some(move => move > (amount * 10) / 100) && amount > 0) {
    setTimeout(() => {
      movements.push(amount);
      renderMovements(movements, currencySign);
      renderSummary(user, currencySign);
      renderBalance(user, currencySign);
    }, Math.trunc(((Math.random() * 2) + 1) * 1000));
  }

};

btnLogin.addEventListener('click', event => {
  event.preventDefault();
  logOutTimerId && clearInterval(logOutTimerId);

  const {
    isValid,
    validUser,
    validUser: {
      owner,
      currency,
      movements
    }
  } = validateAndGetUser();
  const currencySign = currencies.get(currency);

  if (isValid) {
    containerApp.style.opacity = '100%';
    setLogOutTimer();
    renderWelcomeMessage(owner);
    renderUIComponent(labelDate, getCurrentDate());
    renderBalance(validUser, currencySign);
    renderMovements([ ...movements ], currencySign);
    renderSummary(validUser, currencySign);

    btnSort.addEventListener('click',
      () => sortMovements(movements, currencySign));
    btnTransfer.addEventListener('click',
      event => transferMoney(validUser, event, currencySign));
    btnLoan.addEventListener('click',
      event => requestLoan(validUser, event, currencySign));
  }
});

