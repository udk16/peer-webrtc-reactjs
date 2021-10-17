import logo from './logo.svg';
import './App.css';
import Peer from 'peerjs';
import { useEffect, useRef, useState } from 'react';
import { io } from "socket.io-client";

// const socket = io("http://50.35.225.9:5000");
const socket = io("http://50.35.225.9:5006");

function App() {

  //peer
  const [peer, setPeer] = useState(new Peer());
  const [myId, setMyId] = useState('');
  const [conn, setConn] = useState(null);
  const [remoteId, setRemoteId] = useState('');
  const [roomID, setRoomID] = useState('54378');
  //to make visbile or hide the call button
  const [endCallButton, setEndCallButton] = useState(false);
  //client name
  const [clientName, setClientName] = useState('agent');
  //let { current: con } = useRef();
  const [con, setCon] = useState({});
  //local stream
  const [lclstream, setLclstream] = useState();
  //remote stream
  const [remoteStream, setRemoteStream] = useState();
  //localstream set
  let { current: RTCLoaclStream } = useRef(null);
  //call variable
  const [callVr, setCallVr] = useState();

  useEffect(() => {
    console.log(" stream,remote", remoteStream)
    if (remoteStream === undefined) {
      const localVideoElement = document.querySelector("video#localVideo")
      localVideoElement.srcObject = null;
      const remoteVideoElement = document.querySelector("video#remoteVideo");
      remoteVideoElement.srcObject = null;
    }
  }, [remoteStream]);

  useEffect(() => {

    //creating socket instance
    socket.on("connect", () => {
      console.log(socket.id);
    });


    //getting all clientsid present in the room , we are filtering the ids
    socket.on('peersData', (data) => {
      for (const key in data) {
        if (key !== socket.id) {
          console.log("data comming from server", data[key])
          setRemoteId(data[key].peerID)
        }
      }
    })

    socket.on("hi", (data) => {
      console.log("data from server ", data)
    })

    //creating peer object
    console.log("peer object ", peer);

    peer.on('open', (id) => {
      //setMyid
      setMyId(id);
    })

    socket.on("callButton", () => {
      const buttonElement = document.querySelector("button#callButton");
      buttonElement.style.display = "inline";
    })
//on anyone leaves thr room 
socket.on("clientLeave",(data)=>{console.log(data," has left")})

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
      //set callVr 
      setCallVr(call);
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
        setRemoteStream(rmtstream)
        const remoteVideoElement = document.querySelector("video#remoteVideo");
        remoteVideoElement.srcObject = rmtstream;
        //visible the end call button
        setEndCallButton(true);
      })

      //Emitted when either you or the remote peer closes the media connection.
      call.on('close', () => {
        console.log("remote stream closed")
        const localVideoElement = document.querySelector("video#localVideo")
        localVideoElement.srcObject = null;
        const remoteVideoElement = document.querySelector("video#remoteVideo");
        remoteVideoElement.srcObject = null;
      })
    });

    //peer connection close
    peer.on('close', async () => {
      //peer.close()
      console.log("peer disconnected")
      //setRemoteStream()
      //setLclstream()
      const mediaStrm = navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      const localVideoElement = document.querySelector("video#localVideo")
      localVideoElement.srcObject = null;
      const remoteVideoElement = document.querySelector("video#remoteVideo");
      remoteVideoElement.srcObject = null;
    });

    peer.on("disconnected", () => {
      console.log("disconnected ")
    })

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
    //set callVr 
    setCallVr(call);

    console.log("****make call object inside make call ", call);
    setLclstream(mediaStrm)
    const localVideoElement = document.querySelector("video#localVideo")
    localVideoElement.srcObject = mediaStrm;

    //get remote peer stream
    call.on('stream', (remoteStream) => {
      //another peer media
      console.log("*** inside makecall() the remote stream ", remoteStream);
      setRemoteStream(remoteStream)
      const remoteVideoElement = document.querySelector("video#remoteVideo")
      remoteVideoElement.srcObject = remoteStream;

      //visbile the end call button
      setEndCallButton(true);
    })

    //Emitted when either you or the remote peer closes the media connection.
    call.on('close', () => {
      const localVideoElement = document.querySelector("video#localVideo")
      localVideoElement.srcObject = null;
      const remoteVideoElement = document.querySelector("video#remoteVideo");
      remoteVideoElement.srcObject = null;
    })

  }
  //room join
  const joinRoom = () => {
    //joining room with roomid and peerid
    // socket.emit('roomJoin', { roomID, peerID: myId, clientName });
    //checking
socket.emit("testt","hi hello")
  }

  //call end
  const callEnd = () => {
    peer.destroy();
    socket.emit("leave", {roomID})
  }

  return (
    <div className="App">
      <h1>peer</h1>
      {myId && <h1>ID : {myId}</h1>}
      {remoteId && <h1>RemoteID : { }</h1>}

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
      {endCallButton ? <button onClick={() => { callEnd() }}>End call</button> : ""}
      <h1>Local</h1>
      <video id="localVideo" autoPlay playsInline controls={true} />
      <h1>remote</h1>
      <video id="remoteVideo" autoPlay playsInline controls={true} />
    </div>
  );
}

export default App;
