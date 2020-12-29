/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

/* const options = {
  method: 'post',
  url: 'http://127.0.0.1:3000/api/v1/users/login',
  data: {
    email: email,
    password: password,
  },
  // https://blog.logrocket.com/how-to-make-http-requests-like-a-pro-with-axios/
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
};

const login = async (options) => {
  console.log(email, password);
  try {
    const res = await axios(options);
    console.log(res);
  } catch (err) {
    console.log(err);
  }
};*/

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      //url: 'http://127.0.0.1:3000/api/v1/users/login',
      url: '/api/v1/users/login', // for deploy
      data: {
        email,
        password,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Legeado correctamente');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    //console.log(res);
  } catch (error) {
    showAlert('error', error.response.data.message);
    //console.log(error.response.data);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      //url: 'http://127.0.0.1:3000/api/v1/users/logout',
      url: '/api/v1/users/logout', //for deploy
    });
    if ((res.data.status = 'success')) location.assign('/');
  } catch (err) {
    showAlert('error', 'Error loggin out!! Try again.');
  }
};
