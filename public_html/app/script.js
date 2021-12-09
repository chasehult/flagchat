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
      getPosts(posts);
  })
<<<<<<< Updated upstream
}
=======
}

function getPoster(user_id) {
    var un = '';

    $.ajax({
        url: '/get/username/' + user_id,
        method: 'GET',
        async: false,
        success: function (username) {
            un = username;
        }
    });

    return un;
}

function getPosts(posts) {
    resStr = '';

    for (post of posts) {
<<<<<<< Updated upstream
        let r = posts[post];
        resStr += '<div class="post"><b>' + r.poster + '</b><p>' + r.content + '</p><p>'
            + r.likes.length + ' likes</p></div>';
=======
        let r = posts[i];
        resStr += '<div class="post"><b>' + getPoster(r.poster) + '</b><p>' + r.content + '</p><p>'
            + r.likes.length + ' likes</p><div id="replyinput">< textarea id = "rInput" cols = "75" rows = "1" >' +
            'write message...</textarea ><input id="sendreply" type="button" value="Send Message"' +
            'onclick="sendReply();" /></div ></div>';
>>>>>>> Stashed changes
    }

    $('#posts').html(resStr);
    $('#posts').scrollTop = $('#posts').scrollHeight;
}

function getMessages(messages) {
    resStr = '';

    for (message of messages) {
        let r = messages[message];
        resStr += '<div class="message"><b>' + r.poster + '</b><p>' + r.content + '</p></div>';
    }

    $('#chatlog').html(resStr);
    $('#chatlog').scrollTop = $('#chatlog').scrollHeight;
}

//<div id="replyinput">< textarea id="rInput" cols="75" rows="1" >' +
//    'write message...</div>
>>>>>>> Stashed changes
