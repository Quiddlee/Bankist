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
  owner: 'Jessica Davis',
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

// App
const currencies = new Map([
  [ 'EUR', '€' ],
  [ 'USD', '$' ]
]);

const validateAndGetUser = () => {
  let isValid = false;
  let validUser;

  const [ inputLogin, inputPin ] = [
    inputLoginUsername.value.trim().toLowerCase(),
    +inputLoginPin.value.trim().toLowerCase() ];

  for (const account of accounts) {
    const { owner, pin, login } = account;

    if (login === inputLogin && pin === inputPin) {
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

  if (hours < 12) {
    message += 'Morning';
  } else if (hours >= 12 && hours < 18) {
    message += 'Day';
  } else if (hours >= 18 && hours < 21) {
    message += 'Afternoon';
  } else if (hours >= 21 && hours < 23) {
    message += 'Evening';
  }

  return labelWelcome.textContent = `${ message }, ${ userName.slice(0,
    userName.indexOf(' ')) }!`;
};

const getCurrentDate = () => {
  const date = new Date();
  const time = `${ date.getHours() }:${ date.getMinutes() }`;
  const day = date.getDate() < 10
    ? `0${ date.getDate() }`
    : date.getDate();
  const month = date.getMonth() + 1 < 10
    ? `0${ date.getMonth() + 1 }`
    : date.getMonth() + 1;

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

const calculateBalance = (user) => {
  return user.movements.reduce((curr, prev) => curr + prev);
};

const renderMovements = (user) => {
  containerMovements.innerHTML = '';
  const { currency, movements } = user;
  const curr = currencies.get(currency);

  movements.forEach((movement, i) => {
    const moveEl = document.createElement('div');
    const depositClass = movement >= 0
      ? 'movements__type--deposit'
      : 'movements__type--withdrawal';
    const depositType = depositClass.slice(depositClass.lastIndexOf('-') + 1);
    const depositDate = getCurrentDate().
      slice(0, getCurrentDate().indexOf(','));

    moveEl.classList.add('movements__row');
    moveEl.innerHTML = `
          <div class='movements__type ${ depositClass } '>${ i +
    1 } ${ depositType }</div>
          <div class='movements__date'>${ depositDate }</div>
          <div class='movements__value'>${ (movement.toFixed(2)).replace('.',
      ',') }${ curr }</div>
    `;

    containerMovements.prepend(moveEl);
  });
};

btnLogin.addEventListener('click', event => {
  event.preventDefault();
  const { isValid, validUser, validUser: { owner } } = validateAndGetUser();

  if (isValid) {
    containerApp.style.opacity = '100%';
    renderWelcomeMessage(owner);
    renderUIComponent('.date', getCurrentDate());
    renderUIComponent(labelBalance, calculateBalance(validUser));
    renderMovements(validUser);
  }
});