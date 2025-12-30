importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAXSz2NPNb59c3-ova9q8qn7pkH2Sq61T8',
  authDomain: 'hospital-app-fc76d.firebaseapp.com',
  projectId: 'hospital-app-fc76d',
  messagingSenderId: '40842514446',
  appId: '1:40842514446:web:f0fdc65aa6166630c9ec5f'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: '/assets/logo.png'
    }
  );
});
