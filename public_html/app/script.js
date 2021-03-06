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
  setImage();
  getFeed();
}

function setImage() {
    $.ajax({
        url: '/get/pfp/' + username,
        method: 'GET',
        success: function (pic) {
            $('.pfp').attr('src', "../uploads/images/" + pic);
        },
        error: function (status, err) {
            $('.pfp').attr('src', "imgs/defaulticon.jpg");
        }
    });
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

function startConversation() {

    $.post(window.location.origin + '/post/chat', {
        content: $('#mInput').val(),
        from: username,
        to: $('#recipient').val()
    }, (data, status) => {

        if (status != 200) {
            alert("Username not found!");
        }
        else {
            alert(data);
        }
    });

}

function sendMessage() {
    $.post(window.location.origin + '/post/chat', {
        from: username,
        to: $('#recipient').val(),
        content: $('#mInput').val(),
    }, (data, status) => {
        alert(data);
    }).fail(function(data, status, err) {
        alert(data.responseText);
    });
}

function getFeed() {
  $.get('/get/feed/' + username, (posts, status) => {
    posts.sort((a, b) => {return new Date(b['timestamp']) - new Date(a['timestamp']);});
    getPosts(posts, '#posts');
});
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

function getPosts(posts, element) {
    resStr = '';

    for (post of posts) {
        let r = post;
        resStr += '<div class="post"><b class="poster">' + getPoster(r.poster) + '</b><p class="postcontent">' + r.content
            + '</p><input type="button" onclick="like()" class="likebutton" value="Like" /><b class="likecount">' + r.likes.length
            + ' likes</b></div>';
    }

    $(element).html(resStr);
    $(element).scrollTop = $(element).scrollHeight;
}

function getProfilePosts() {
    $.get('/get/posts/:username', (posts, status) => {
        posts.sort((a, b) => { return new Date(b['timestamp']) - new Date(a['timestamp']); });
        getPosts(posts, '#profilecontent');
    })
}

function getMessages(messages) {
    resStr = '';

    for (message of messages) {
        let r = messages;
        resStr += '<div class="message"><b>' + getPoster(r.poster) + '</b><p>' + r.content + '</p></div>';
    }

    $('#chatlog').html(resStr);
    $('#chatlog').scrollTop = $('#chatlog').scrollHeight;
}

function getChatLog() {
    var user1 = username;
    var user2 = $('#recipient').val();

    $.get('/get/dms/:user1/:user2', (messages, status) => {
        messages.sort((a, b) => { return new Date(a['timestamp']) - new Date(b['timestamp']); });
        getMessages(messages);
    })
}

function like() {
    
}

function searchUsers() {
    let key = $('#searchbox').val();
    $.ajax({
        url: '/search/users/' + key,
        method: 'GET',
        success: function (result) {
            let element = $('#userlist');
            results = JSON.parse(result);
            resStr = '';
            for (var i in results) {
                let r = results[i];
                resStr += r.username + '<input onclick="follow()" type="button" id="followbutton" value="follow" class="submit" /><br />';
            }
            element.html(resStr);
            element.scrollTop = element.scrollHeight;
        }
    });
}

function addImage() {
  var formData = new FormData();
  formData.append("photo", image = $("#fileButton").prop('files')[0]);
  $.ajax({
    url: window.location.origin + '/upload',
    data: formData,
    enctype: 'multipart/form-data',
    cache: false,
    contentType: false,
    processData: false,
    method: 'POST',
    type: 'POST', // For jQuery < 1.9
    success: function(data) {
      $.post(window.location.origin + '/post/pfp', {
        username: username,
        filename: data.filename,
    }, (data, status) => {
        alert(data);
        window.location.reload();
    });
  }
});
}
