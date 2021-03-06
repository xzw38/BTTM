angular.module("app").service("ChatSvc", function ($http) {
  var svc = this;

  // Get's top ten recent messages from both users.
  svc.getRecentMessages = function(otherUser){
    return $http.get("api/chat/"+otherUser).then(function(response){
      return response.data;
    });
  };

  svc.sendMessage = function(otherUser,messageBody){
    return $http.post("api/chat/",{otherUser:otherUser,body:messageBody});
  }

  svc.sendMessageWithOfferID = function (otherUser,messageBody,_id) {
      return $http.post("api/chat/special/",{otherUser:otherUser,body:messageBody,offerId:_id});
  }

}) /* End of ChatSvc*/
