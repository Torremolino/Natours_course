// API logic

// 1- Implement restricition that user can only review a toru that they hava actually booked.
// 2- Implement nested booking routes: /tour/:id/bookings  and  /user/:id/booking.
// 3- Improve toru dates: add a participants and a soldOutField to each date. A date then becomes like a instance of the tour. Then, when a user books, they need to select one of the dates. A new booking will incresase the number of participants in the date, until it is booked out (participants > maxGroupSize). So, when a user wants to book, you need to check if tour on the selected date is still available.
// 4- Implement advanced authentication features: confirm user email, keep users logged in with refresh tokens, two-factor authentication, etc.

// WEBSITE
// 1- Implement a sing up from, similar to the logic form.
// 2- On the tour detail page, if a user has taken a tour, allow them add a review directly on the website.
// 3- Hide the entire booking section on the tour detail page if current user has already booked the tour (also prevent duplicate bookings on the model).
// 4- Implement "like tour" funcionality, with favorite tour page.
// 5- On the user account page, implement the "My Reviews" page, where all reviews are displayed, and a user can edit them (If you know React, this would be an amazing way to use the Natours API and train your skills!)
// 6- For administrators, implement all the "Manage" pages, where they can CRUD (create, read, update, delete) tours, users, reviews and bookings.
