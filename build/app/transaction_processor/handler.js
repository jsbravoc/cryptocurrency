const _0x129a=['10607sNGaMo','Handling\x20put\x20transaction','\x20->','1.0','warn','sha512','bind','cnk-cryptocurrency','slice','NOTIFY','ALgZJ','Transaction\x20was\x20not\x20JSON\x20parsable','457889ErckiX','keysCanCollide','crypto','digest','510287GESbfj','Error\x20at\x20getContext\x20-\x20Transaction\x20type\x20was\x20not\x20defined','log','Handling\x20transaction\x20with\x20type\x20','Handling\x20delete\x20transaction','toString','Updated\x20state\x20','108314bVwflW','2xGfFPa','WARN','\x20->\x20','523850ekCgnt','Added\x20state\x20','table','3GWgTDI','constructor','./utils/logger','return\x20(function()\x20','WzRQD','prototype','gwfbf','Transaction\x20type\x20was\x20not\x20defined','Handling\x20post\x20transaction','./utils/constants','TRANSFER','TRANSACTION','__proto__','1WPAVQr','ERROR','488717TrsGpz','trace','SUCCESS','10FEtnsD','parse','USER','{}.constructor(\x22return\x20this\x22)(\x20)','1GvSBId','414169uekkqu','console','21rxVTex','Error\x20at\x20getContext\x20-\x20','error'];const _0x483d=function(_0x53a0b2,_0x37e5a0){_0x53a0b2=_0x53a0b2-0x18c;let _0x4a74ba=_0x129a[_0x53a0b2];return _0x4a74ba;};const _0x27f08d=_0x483d;(function(_0x220e44,_0xafe6c9){const _0x38f16b=_0x483d;while(!![]){try{const _0x581b61=parseInt(_0x38f16b(0x1a3))*parseInt(_0x38f16b(0x1a0))+-parseInt(_0x38f16b(0x198))+parseInt(_0x38f16b(0x1a6))*-parseInt(_0x38f16b(0x1bd))+parseInt(_0x38f16b(0x1bc))*-parseInt(_0x38f16b(0x194))+parseInt(_0x38f16b(0x1bf))*parseInt(_0x38f16b(0x1c2))+-parseInt(_0x38f16b(0x19f))*-parseInt(_0x38f16b(0x1b8))+-parseInt(_0x38f16b(0x1b3))*-parseInt(_0x38f16b(0x1b5));if(_0x581b61===_0xafe6c9)break;else _0x220e44['push'](_0x220e44['shift']());}catch(_0x3a2d0a){_0x220e44['push'](_0x220e44['shift']());}}}(_0x129a,0x9a345));const _0x495727=function(){let _0x3fdae3=!![];return function(_0x5ef7c0,_0xf394d7){const _0x1c7138=_0x3fdae3?function(){const _0x3693b8=_0x483d;if(_0xf394d7){if(_0x3693b8(0x1aa)!==_0x3693b8(0x1aa)){function _0x23a008(){const _0x2968fb=_0x3693b8;_0x242bec=_0x288335[_0x2968fb(0x1b9)](_0x3f9e2e);}}else{const _0x29085b=_0xf394d7['apply'](_0x5ef7c0,arguments);return _0xf394d7=null,_0x29085b;}}}:function(){};return _0x3fdae3=![],_0x1c7138;};}(),_0x1ddb54=_0x495727(this,function(){const _0x1484c6=_0x483d;let _0x2bff53;try{const _0x2a9280=Function(_0x1484c6(0x1a9)+_0x1484c6(0x1bb)+');');_0x2bff53=_0x2a9280();}catch(_0x547c81){_0x2bff53=window;}const _0x5787de=_0x2bff53[_0x1484c6(0x1be)]=_0x2bff53[_0x1484c6(0x1be)]||{},_0x209c19=[_0x1484c6(0x19a),_0x1484c6(0x18c),'info',_0x1484c6(0x1c1),'exception',_0x1484c6(0x1a5),_0x1484c6(0x1b6)];for(let _0x6d4365=0x0;_0x6d4365<_0x209c19['length'];_0x6d4365++){if(_0x1484c6(0x192)===_0x1484c6(0x192)){const _0x286a46=_0x495727[_0x1484c6(0x1a7)][_0x1484c6(0x1ab)][_0x1484c6(0x18e)](_0x495727),_0x43085c=_0x209c19[_0x6d4365],_0x3919c3=_0x5787de[_0x43085c]||_0x286a46;_0x286a46[_0x1484c6(0x1b2)]=_0x495727[_0x1484c6(0x18e)](_0x495727),_0x286a46[_0x1484c6(0x19d)]=_0x3919c3[_0x1484c6(0x19d)][_0x1484c6(0x18e)](_0x3919c3),_0x5787de[_0x43085c]=_0x286a46;}else{function _0x17d2ec(){const _0x163f90=_0x1484c6;throw _0x296fa9(_0x163f90(0x1c0)+_0x18d36d,_0xf76715['ERROR'],_0x13fcfb),new _0x5764b2(_0x163f90(0x193));}}}});_0x1ddb54();const crypto=require(_0x27f08d(0x196)),{InvalidTransaction}=require('sawtooth-sdk/processor/exceptions'),{TYPE}=require(_0x27f08d(0x1af)),{logFormatted,SEVERITY}=require(_0x27f08d(0x1a8)),TP_FAMILY=_0x27f08d(0x18f),TP_VERSION=_0x27f08d(0x1c5),hash512=_0x4d0748=>crypto['createHash'](_0x27f08d(0x18d))['update'](_0x4d0748)[_0x27f08d(0x197)]('hex'),getAddress=(_0x4f9890,_0xeeeabd=0x40)=>hash512(_0x4f9890)[_0x27f08d(0x190)](0x0,_0xeeeabd),TRANSACTION_FAMILY=_0x27f08d(0x18f),TP_NAMESPACE=getAddress(TRANSACTION_FAMILY,0x6),getTransactionAddress=_0xdf1f91=>TP_NAMESPACE+'00'+getAddress(_0xdf1f91,0x3e),getUserAddress=_0x5c76a7=>TP_NAMESPACE+'01'+getAddress(_0x5c76a7,0x3e),getTransferAddress=_0x522a4f=>TP_NAMESPACE+'02'+getAddress(_0x522a4f,0x3e),addressIntKey=(_0x743939,_0x4e58ee)=>{const _0xeca9f4=_0x27f08d;switch(_0x4e58ee){case _0xeca9f4(0x1b1):return getTransactionAddress(_0x743939);case'USER':return getUserAddress(_0x743939);case _0xeca9f4(0x1b0):return getTransferAddress(_0x743939);default:return'';}};addressIntKey[_0x27f08d(0x195)]=!0x0;const getContext=([_0x1350ca,_0x643a1,_0x5a7c5a],_0x35449f)=>{const _0x286aee=_0x27f08d;let _0x227bc0;try{if('gwfbf'===_0x286aee(0x1ac))_0x227bc0=JSON[_0x286aee(0x1b9)](_0x35449f);else{function _0x1b2cdf(){const _0xe858b3=_0x286aee;let _0x51ff81;try{_0x51ff81=_0x2c0ba4[_0xe858b3(0x1b9)](_0x2d7dfc);}catch(_0x14cf45){throw _0x1a789e('Error\x20at\x20getContext\x20-\x20'+_0x14cf45,_0x4d48cd[_0xe858b3(0x1b4)],_0x51ff81),new _0x5b4a1a(_0xe858b3(0x193));}var {type:_0x2d7dfc}=_0x51ff81;switch(_0x1ee5ef(_0xe858b3(0x19b)+_0x2d7dfc,_0x375d63[_0xe858b3(0x1a1)],_0x51ff81),_0x2d7dfc){case _0x29d406[_0xe858b3(0x1b1)]:return _0x27abc5;case _0x2a4e4a[_0xe858b3(0x1ba)]:return _0x2887b2;case _0x15c881['TRANSFER']:return _0x53f30d;default:throw _0x4fc7a8('Error\x20at\x20getContext\x20-\x20Transaction\x20type\x20was\x20not\x20defined',_0x11206c[_0xe858b3(0x1b4)],_0x51ff81),new _0x5876fc(_0xe858b3(0x1ad));}}}}catch(_0x11959b){throw logFormatted(_0x286aee(0x1c0)+_0x11959b,SEVERITY[_0x286aee(0x1b4)],_0x227bc0),new InvalidTransaction(_0x286aee(0x193));}var {type:_0x35449f}=_0x227bc0;switch(logFormatted(_0x286aee(0x19b)+_0x35449f,SEVERITY[_0x286aee(0x1a1)],_0x227bc0),_0x35449f){case TYPE[_0x286aee(0x1b1)]:return _0x1350ca;case TYPE[_0x286aee(0x1ba)]:return _0x643a1;case TYPE[_0x286aee(0x1b0)]:return _0x5a7c5a;default:throw logFormatted(_0x286aee(0x199),SEVERITY['ERROR'],_0x227bc0),new InvalidTransaction(_0x286aee(0x1ad));}},handlers={async 'delete'([_0x16b9ab,_0x6562b6,_0x52b280],{transaction:_0x51e75b,txid:_0xd51ec9}){const _0x5cd9ee=_0x27f08d;logFormatted(_0x5cd9ee(0x19c),SEVERITY[_0x5cd9ee(0x191)],{'transaction':_0x51e75b,'txid':_0xd51ec9});const _0x1d58df=getContext([_0x16b9ab,_0x6562b6,_0x52b280],_0x51e75b);var {output:_0x51e75b}=JSON[_0x5cd9ee(0x1b9)](_0x51e75b);await _0x1d58df['putState'](_0xd51ec9,_0x51e75b);},async 'post'([_0x564268,_0x3c90a2,_0x317779],{transaction:_0x43a123,txid:_0x2b5116}){const _0x21e33d=_0x27f08d;logFormatted(_0x21e33d(0x1ae),SEVERITY['NOTIFY'],{'transaction':_0x43a123,'txid':_0x2b5116});const _0x19fb5d=getContext([_0x564268,_0x3c90a2,_0x317779],_0x43a123),{type:_0x303099,..._0x1b7bb2}=JSON['parse'](_0x43a123);await _0x19fb5d['putState'](_0x2b5116,_0x1b7bb2),logFormatted(_0x21e33d(0x1a4)+_0x2b5116+'\x20->\x20'+getUserAddress(_0x2b5116)+_0x21e33d(0x1c4),SEVERITY['SUCCESS'],_0x1b7bb2);},async 'put'([_0xf5e3cc,_0x50f018,_0x3e228b],{transaction:_0x53d1bd,txid:_0x3c2669}){const _0x4404d3=_0x27f08d;logFormatted(_0x4404d3(0x1c3),SEVERITY['NOTIFY'],{'transaction':_0x53d1bd,'txid':_0x3c2669});const _0xc0a499=getContext([_0xf5e3cc,_0x50f018,_0x3e228b],_0x53d1bd),{type:_0x5cfe38,..._0x2e60ba}=JSON[_0x4404d3(0x1b9)](_0x53d1bd);await _0xc0a499['putState'](_0x3c2669,_0x2e60ba),logFormatted(_0x4404d3(0x19e)+_0x3c2669+_0x4404d3(0x1a2)+getUserAddress(_0x3c2669)+_0x4404d3(0x1c4),SEVERITY[_0x4404d3(0x1b7)],_0x2e60ba);}};module['exports']={'TP_FAMILY':TP_FAMILY,'TP_VERSION':TP_VERSION,'TP_NAMESPACE':TP_NAMESPACE,'handlers':handlers,'addresses':{'getTransactionAddress':getTransactionAddress,'getUserAddress':getUserAddress,'getTransferAddress':getTransferAddress}};