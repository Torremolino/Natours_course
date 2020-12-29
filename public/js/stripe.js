/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51I3OTTKeInpdE4LNFYYaHNMTeC9dfvtFmAGtHX8gZ7HXBQNE3YuAkwADQ6Yqx5QGLzykYDetE2qSAcBYXCAAuuzS00Euu5gisK'
  );

  try {
    //1) get the  check out session from api
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    //2) create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('ERROR', err);
  }
};
