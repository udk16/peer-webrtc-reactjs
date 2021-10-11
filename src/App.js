import logo from './logo.svg';
import './App.css';
import Peer from 'peerjs';
import { useEffect, useRef, useState } from 'react';
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {

  //peer
  const [peer, setPeer] = useState(new Peer());
  const [myId, setMyId] = useState('');
  const [conn, setConn] = useState(null);
  const [remoteId, setRemoteId] = useState('');
  const [roomID, setRoomID] = useState('54378');
  //client name
  const [clientName, setClientName] = useState('agent');
  //let { current: con } = useRef();
  const [con, setCon] = useState({});

  //video elements


  const [lclstream, setLclstream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  //localstream set
  let { current: RTCLoaclStream } = useRef(null);
  //const peerRef=useRef(peer)


  useEffect(() => {

    //creating socket instance
    socket.on("connect", () => {
      console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    });
    
    //getting all clientsid present in the room , we are filtering the ids
    socket.on('peersData', (data) => {
      for (const key in data) {
        if (key !== socket.id) {
          console.log("data comming from server", data[key])
          setRemoteId(data[key].myId)
          //makeCall()
        }
      }
      //makeCall()
    })

    socket.on("hi", (data) => {
      console.log("data from server ", data)
    })


    //creating peer object
    console.log("peer object ", peer);

    peer.on('open', (id) => {
      //setMyid
      setMyId(id);
      //socket.emit('peerID', {roomID,peerID: id, clientName})

    })

    socket.on("callButton", () => {
      const buttonElement = document.querySelector("button#callButton");
      buttonElement.style.display = "inline";
    })


    //receiving friend peerid
    socket.on("friends", async (friends) => {
      console.log("friends ", friends)
      const friendPeerid = friends.friendPeerId;
      console.log("friend peerId ===", friendPeerid)

      setRemoteId(friendPeerid)
      console.log(remoteId)

    })

    //data connection
    peer.on('connection', (rmtconn) => {
      console.log("remote connection ", rmtconn);
      rmtconn.on('open', () => {
        rmtconn.on('data', (data) => {
          console.log("data friom another client ", data);
        });
      });
    })

    //when we get call
    peer.on('call', (call) => {
      console.log("*** remote peer calling ", call);
      // Answer the call, providing our mediaStream
      const mediaStrm = navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      mediaStrm.then((stream) => {
        call.answer(stream);
        console.log("Local stream inside peer.on(call) ", stream);
        const localVideoElement = document.querySelector("video#localVideo");
        localVideoElement.srcObject = stream;
      });

      //when we get remotestream
      call.on('stream', (rmtstream) => {
        console.log("**** remoteStream ", rmtstream);
        const remoteVideoElement = document.querySelector("video#remoteVideo");
        remoteVideoElement.srcObject = rmtstream;

      })
    });

  }, [])
  //if remoteid is set them makecall button will be visible
  useEffect(() => {

    if (remoteId) {

      console.log("makecall button is  visible")
      socket.emit("makecall", roomID)
    }
    else {

      console.log("makecall button not visible")
    }
  }, [remoteId])
  //message exchange
  const dataChannel = (remoteId) => {
    console.log("remote peer ID ", remoteId);
    const datachnnl = peer.connect(remoteId);
    //con = datachnnl;
    setCon(datachnnl);
    console.log("con ", con)

    datachnnl.on('data', (data) => {
      console.log("data friom another client ", data);
    });
  }

  const getLocalStream = async () => {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  }

  //make a call
  const makeCall = async () => {
    //check weather remote id 
    console.log("remoted id stored locally ", remoteId);

    const mediaStrm = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    console.log("******** local stream inside making call", mediaStrm);
    let call = peer.call(remoteId, mediaStrm);

    console.log("****make call object inside make call ", call);

    const localVideoElement = document.querySelector("video#localVideo")
    localVideoElement.srcObject = mediaStrm;

    //get remote peer stream
    call.on('stream', (remoteStream) => {
      //another peer media
      console.log("*** inside makecall() the remote stream ", remoteStream);
      const remoteVideoElement = document.querySelector("video#remoteVideo")
      remoteVideoElement.srcObject = remoteStream;
    })
  }
  //room join
  const joinRoom = () => {
    //joining room with roomid and peerid
    socket.emit('roomJoin', { roomID, myId });
  }

  return (
    <div className="App">
      <h1>peer</h1>
      {myId && <h1>ID : {myId}</h1>}
      {remoteId && <h1>RemoteID : {remoteId}</h1>}

      <input type="text" id="text" />
      <button onClick={() => {
        const d = document.getElementById("text").value;
        //setRemote Id
        setRemoteId(d);
        //call data Channel
        //   dataChannel(d);
      }}>connect</button>

      <button onClick={() => {//send message to another client
        console.log("inside send butto con ", con)
        con.send('Hello!');
      }}>send message </button>
      <button onClick={() => joinRoom()}>join room</button>

      <button id="callButton" style={{ display: 'none' }} onClick={() => makeCall()}>make call</button>

      <h1>Local</h1>
      <video id="localVideo" autoPlay playsInline controls={true} />
      <h1>remote</h1>
      <video id="remoteVideo" autoPlay playsInline controls={true} />
    </div>
  );
}

export default App;
