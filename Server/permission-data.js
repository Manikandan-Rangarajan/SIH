const Dataperms={
    "roles": {
      "admin": {
        "permissions": [
          { "can": "*" }
        ]
      },
      "superuser": {
        "permissions": [
          { "can": "*" }
        ]
      },
      "client": {
        "permissions": [
          { "can": "send_msg" },
          { "can": "receive_msg" }
        ]
      },
      "freightForwarder": {
        "permissions": [
          { "can": "receive_msg" }
        ],
        "inherited": ["approvedFreightForwarder"]
      },
      "approvedFreightForwarder": {
        "permissions": [
          { "can": "send_msg" },
          { "can": "receive_msg" }
        ]
      }
    },
    "users": {
      "1": ["admin"],
      "2": ["superuser"],
      "3": ["client"],
      "4": ["freightForwarder"],
      "5": ["approvedFreightForwarder"]
    }
  }
  
export default Dataperms;