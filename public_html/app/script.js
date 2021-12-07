/*
 * Author: Chase Hult
 * Purpose: FlagChat Main Page
 */

// From https://stackoverflow.com/questions/5047346/converting-strings-like-document-cookie-to-objects
cookies = document.cookie.split('; ').reduce((prev, current) => {
  const [name, ...value] = current.split('=');
  prev[name] = value.join('=');
  return prev;
}, {});

if ('login' in cookies) {
  username = JSON.parse(decodeURIComponent(cookies.login)).username;
  $('#un').text(username);
} else {
  alert("Session Expired.")
  window.location.href = '/login/index.html';
}


function post() {
  $.post(window.location.origin + '/post/post', {
    poster: username,
    content: $('#newPostContent').val(),
  }, (data, status) => {
    alert(data);
  });
}

function getFeed() {
  $.get('/get/feed/' + username, (data, status) => {
    posts = JSON.parse(data);
    console.log(posts);
  })
}