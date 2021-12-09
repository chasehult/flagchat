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
} else {
  alert("Session Expired.")
  window.location.href = window.location.origin + '/login/index.html';
}


function init() {
  $('.unfield').text(username);
  getFeed();
}

function sendPost() {
  $.post(window.location.origin + '/post/post', {
    poster: username,
    content: $('#newPostContent').val(),
  }, (data, status) => {
    alert(data);
    window.location.reload();
  });
}

function getFeed() {
  $.get('/get/feed/' + username, (posts, status) => {
    posts.sort((a, b) => {return new Date(b['timestamp']) - new Date(a['timestamp']);});
    console.log(posts);
    for (post of posts) {
      $('#posts').append("<p>" + post['content'] + "</p>")
    }
  })
}