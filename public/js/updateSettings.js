/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

// type es 'password' o 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : 'http://127.0.0.1:3000/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} guardado correctamente`);
    }
    //console.log(res);
  } catch (error) {
    showAlert('error', error.response.data.message);
    //console.log(error.response.data);
  }
};

/* export const updateData = async (name, email) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      data: {
        name,
        email,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Datos guardados correctamente');
    }
    //console.log(res);
  } catch (error) {
    showAlert('error', error.response.data.message);
    //console.log(error.response.data);
  }
}; */
