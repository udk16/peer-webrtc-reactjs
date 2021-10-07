import logo from './logo.svg';
import './App.css';
import Peer from 'peerjs';
import { useEffect, useRef, useState } from 'react';

function App() {

  //peer
  const [peer, setPeer] = useState(new Peer());
  const [myId, setMyId] = useState('');
  const [conn, setConn] = useState(null);
  const [remoteId, setRemoteId] = useState('');
  //let { current: con } = useRef();
  const [con,setCon] = useState({});
  //localstream set
  let { current: RTCLoaclStream } = useRef(null);
//const peerRef=useRef(peer)
  useEffect(() => {
    console.log("peer object ", peer);

    //localStrm();

    peer.on('open', (id) => {
      //setMyid
      setMyId(id);
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
    peer.on('call', function(call) {
      // Answer the call, providing our mediaStream
      const media =  navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      //if media stream present
      if (media) {
        console.log("******** answering stream ");
        //assign media stream to RTCLoaclStream
        media.then((stream)=>{//console.log(stream)
          call.answer(stream);
          const videoElement = document.querySelector("video#localVideo")
          videoElement.srcObject = stream;
        console.log("my local stream",stream)
        })//.getVideoTracks().forEach((track)=>{
         // track.stop();
       //   track.enabled = false;
        
       // })
      }
     
     // call.answer(media);
      console.log("*** remote peer calling ", call);

       call.on('stream', (stream) => {
        console.log("**** remoteStream ",stream);
        const videoElement = document.querySelector("video#remoteVideo")
        videoElement.srcObject = stream;

      }) 
    });
  }, [])

  //get the local stream
  /*const localStrm = async () => {
    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    //if media stream present
    if (media) {
      console.log("******** local stream inside localStrm() ", media);
      //assign media stream to RTCLoaclStream
     
      RTCLoaclStream = media;
      const videoElement = document.querySelector("video#localVideo")
      videoElement.srcObject = media;
    }
    //return media;
    else {
      console.log("**** No LOcal Stream ***");
    }
  }*/

  //message exchange
  const dataChannel = (remoteId) => {
    console.log("remote peer ID ", remoteId);
    const datachnnl = peer.connect(remoteId);
    //con = datachnnl;
    setCon(datachnnl);
    console.log("con ",con)

    datachnnl.on('data', (data) => {
      console.log("data friom another client ", data);
    });
  }

  //make a call
  const makeCall = () => {
    //check weather remote id 
    console.log("remoted id stored locally ", remoteId);
    const media =  navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    //if media stream present
    if (media) {
      console.log("******** making call", media);
      //assign media stream to RTCLoaclStream
      media.then((stream)=>{
        const call = peer.call(remoteId,stream);
        console.log("****local call ", call)
        const videoElement = document.querySelector("video#localVideo")
        videoElement.srcObject = stream;
//on remote stream receiving
        call.on('stream',(remoteStream)=>{
          //another peer media
          console.log("*** inside makecall() the remote stream ",remoteStream);
          const videoElement = document.querySelector("video#remoteVideo")
          videoElement.srcObject = stream;
        })

      })//then close
      }
   
//console.log(RTCLoaclStream)
    //call to peer
    //var call = peer.call(remoteId,media);
    //console.log("****local call ", call)
   // call.on('stream',(remoteStream)=>{
      //another peer media
     // console.log("*** inside makecall() the stream ",remoteStream);
    //}) 
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
      console.log("inside send butto con ",con)
        con.send('Hello!');
      }}>send message </button>

      <button onClick={makeCall}>make call</button>

      <h1>Local</h1>
      <video id="localVideo" autoplay playsinline controls={true} />
      <video id="remoteVideo" autoplay playsinline controls={true} />
    </div>
  );
}

export default App;
