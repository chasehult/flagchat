/*
 * Author: Chase Hult
 * Purpose: FlagChat Login
 */

function login() {
  $.post(window.location.origin + '/post/login', {
    username: $('#logUsername').val(),
    password: $('#logPassword').val(),
    }, (data, status) => {
        alert(data);
        if (data == 'LOGIN') {
          window.location.href = '/app/index.html';
        }
  });
}

function signup() {
  $.post(window.location.origin + '/post/signup', {
    username: $('#signupuser').val(),
    password: $('#signuppass').val(),
  }, function(data, status) {
    alert(data);
    if (data == 'OK') {
          window.location.href = '/login/login.html';
        }
  });
}