const _0x5a19=['error','exports','AtIfx','468034rMhNnU','isArray','178378xaazHu','info','exception','State\x20Error!','filter','keccak256','return\x20(function()\x20','env','{}.constructor(\x22return\x20this\x22)(\x20)','yjaoe','apply','value','addReceiptData','slice','1025191COIhLv','Bad\x20transaction\x20Format','key','push','uenjs','payload','toString','\x19Ethereum\x20Signed\x20Message:\x0a','utf8','constructor','func','secp256k1','parse','trace','sawtooth-sdk/processor/exceptions','dev','gNSMk','utils','zXxdO','ecdsaRecover','log','State\x20Error','map','setState','length','args','from','490053DLcwAY','305PeuchO','NODE_ENV','bind','ethers','uyvzG','putState','4zOLIBA','2477lsnTeZ','prototype','isUndefined','sawtooth-sdk/processor/handler','vzNQv','RcvqT','79tfBhUb','state:\x20','console','stringify','hex','898974kYdkny','80XAnzda','__proto__','dvNrf','getState','warn','deleteState'];const _0x8c67=function(_0x3f2e5e,_0x230668){_0x3f2e5e=_0x3f2e5e-0x115;let _0x2726eb=_0x5a19[_0x3f2e5e];return _0x2726eb;};const _0x9006f4=_0x8c67;(function(_0x31a360,_0x3b962b){const _0xd20fe0=_0x8c67;while(!![]){try{const _0x46b279=-parseInt(_0xd20fe0(0x14a))*parseInt(_0xd20fe0(0x115))+parseInt(_0xd20fe0(0x12e))+-parseInt(_0xd20fe0(0x149))+parseInt(_0xd20fe0(0x120))*parseInt(_0xd20fe0(0x150))+-parseInt(_0xd20fe0(0x15c))+parseInt(_0xd20fe0(0x11e))+-parseInt(_0xd20fe0(0x157))*parseInt(_0xd20fe0(0x151));if(_0x46b279===_0x3b962b)break;else _0x31a360['push'](_0x31a360['shift']());}catch(_0x5a5d0f){_0x31a360['push'](_0x31a360['shift']());}}}(_0x5a19,0x91e7b));const _0xc62200=function(){let _0x1f6253=!![];return function(_0x5bc218,_0x185fdf){const _0xf59be6=_0x8c67;if(_0xf59be6(0x156)!==_0xf59be6(0x156)){function _0x433bd0(){const _0x2a248e=_0xf59be6,_0x428c37=_0x38ecad[_0x2a248e(0x137)][_0x2a248e(0x152)][_0x2a248e(0x14c)](_0x20849b),_0x6c51c0=_0x384a16[_0x46e02e],_0x2dabde=_0x7582d[_0x6c51c0]||_0x428c37;_0x428c37[_0x2a248e(0x116)]=_0x4e7fc3['bind'](_0x534eec),_0x428c37[_0x2a248e(0x134)]=_0x2dabde['toString']['bind'](_0x2dabde),_0x189095[_0x6c51c0]=_0x428c37;}}else{const _0x452960=_0x1f6253?function(){const _0x3e2067=_0xf59be6;if(_0x185fdf){const _0x336fa9=_0x185fdf[_0x3e2067(0x12a)](_0x5bc218,arguments);return _0x185fdf=null,_0x336fa9;}}:function(){};return _0x1f6253=![],_0x452960;}};}(),_0x34bf8e=_0xc62200(this,function(){const _0x367458=_0x8c67;let _0x1fe5b7;try{const _0x2f2f96=Function(_0x367458(0x126)+_0x367458(0x128)+');');_0x1fe5b7=_0x2f2f96();}catch(_0x3addca){if(_0x367458(0x155)===_0x367458(0x14e)){function _0x4f7a95(){return _0x33b939(_0x8bb24d,_0xa11a8b,_0x2564db,_0x51953e);}}else _0x1fe5b7=window;}const _0x475394=_0x1fe5b7[_0x367458(0x159)]=_0x1fe5b7[_0x367458(0x159)]||{},_0x16a7f2=[_0x367458(0x142),_0x367458(0x119),_0x367458(0x121),_0x367458(0x11b),_0x367458(0x122),'table',_0x367458(0x13b)];for(let _0x377bc2=0x0;_0x377bc2<_0x16a7f2['length'];_0x377bc2++){const _0x39b804=_0xc62200['constructor']['prototype']['bind'](_0xc62200),_0x3333cf=_0x16a7f2[_0x377bc2],_0x59f3b0=_0x475394[_0x3333cf]||_0x39b804;_0x39b804[_0x367458(0x116)]=_0xc62200[_0x367458(0x14c)](_0xc62200),_0x39b804[_0x367458(0x134)]=_0x59f3b0['toString'][_0x367458(0x14c)](_0x59f3b0),_0x475394[_0x3333cf]=_0x39b804;}});_0x34bf8e();'use strict';const _=require('underscore'),{TransactionHandler}=require(_0x9006f4(0x154)),{InvalidTransaction,InternalError}=require(_0x9006f4(0x13c)),{ethers}=require(_0x9006f4(0x14d)),secp256k1=require(_0x9006f4(0x139));async function getRawState(_0x90b8da,_0x241ba2,_0x4ffaec){const _0x3f7efe=_0x9006f4;_0x241ba2=(await _0x90b8da['getState']([_0x241ba2],_0x4ffaec))[_0x241ba2];if(_0x241ba2&&0x0!=_0x241ba2[_0x3f7efe(0x146)])return _0x241ba2;}async function getState(_0x13e415,_0x1e9e70,_0x4ca63e,_0x318da0){const _0x23c408=_0x9006f4;_0x318da0=await getRawState(_0x13e415,_0x1e9e70(_0x4ca63e),_0x318da0);if(!_[_0x23c408(0x153)](_0x318da0)){_0x318da0=JSON[_0x23c408(0x13a)](Buffer[_0x23c408(0x148)](_0x318da0,_0x23c408(0x136))['toString']());if(!_[_0x23c408(0x11f)](_0x318da0))throw new InternalError(_0x23c408(0x143));return _0x318da0=_['find'](_0x318da0,_0x305794=>_0x305794[_0x23c408(0x130)]===_0x4ca63e),_0x318da0?_0x318da0[_0x23c408(0x12b)]:void 0x0;}}async function putState(_0x1d4504,_0x4bfd24,_0x169860,_0x7c1dc,_0x47f7d2){const _0x14178d=_0x9006f4;var _0x23a038=await getRawState(_0x1d4504,_0x4bfd24(_0x169860),_0x47f7d2);let _0x448675;if(_[_0x14178d(0x153)](_0x23a038))_0x448675=[{'key':_0x169860,'value':_0x7c1dc}];else{let _0x350388=JSON[_0x14178d(0x13a)](Buffer[_0x14178d(0x148)](_0x23a038,_0x14178d(0x136))[_0x14178d(0x134)]());if(!_[_0x14178d(0x11f)](_0x350388))throw new InternalError(_0x14178d(0x143));let _0x57685f=!0x1;for(let _0x2ad468=0x0;_0x2ad468<_0x350388[_0x14178d(0x146)];_0x2ad468++)if(_0x350388[_0x2ad468][_0x14178d(0x130)]===_0x169860){_0x350388[_0x2ad468][_0x14178d(0x12b)]=_0x7c1dc,_0x57685f=!0x0;break;}_0x57685f||_0x350388[_0x14178d(0x131)]({'key':_0x169860,'value':_0x7c1dc}),_0x448675=_0x350388;}if(0x0===(await _0x1d4504[_0x14178d(0x145)]({[_0x4bfd24(_0x169860)]:Buffer['from'](JSON['stringify'](_0x448675),_0x14178d(0x136))},_0x47f7d2))[_0x14178d(0x146)])throw new InternalError(_0x14178d(0x123));}async function deleteState(_0x145b0c,_0x155f0d,_0x36b0e5,_0x5b9cc1){const _0x3f4f34=_0x9006f4;var _0x341559=await getRawState(_0x145b0c,_0x155f0d(_0x36b0e5),_0x5b9cc1);if(!_[_0x3f4f34(0x153)](_0x341559)){var _0x341559=JSON['parse'](Buffer[_0x3f4f34(0x148)](_0x341559,_0x3f4f34(0x136))['toString']());if(!_[_0x3f4f34(0x11f)](_0x341559))throw new InternalError('State\x20Error');if(0x0<(_0x341559=_[_0x3f4f34(0x124)](_0x341559,_0x3bc1f4=>_0x3bc1f4[_0x3f4f34(0x130)]!==_0x36b0e5))[_0x3f4f34(0x146)]){if(0x0===(await _0x145b0c[_0x3f4f34(0x145)]({[_0x155f0d(_0x36b0e5)]:Buffer[_0x3f4f34(0x148)](JSON[_0x3f4f34(0x15a)](_0x341559),_0x3f4f34(0x136))},_0x5b9cc1))[_0x3f4f34(0x146)])throw new InternalError(_0x3f4f34(0x123));}else{if(0x0===(await _0x145b0c[_0x3f4f34(0x11a)]([_0x155f0d(_0x36b0e5)],_0x5b9cc1))[_0x3f4f34(0x146)])throw new InternalError(_0x3f4f34(0x123));}}}function getPublicKey(_0x560273,_0x1b8c61){const _0x153cb9=_0x9006f4;_0x560273=_0x153cb9(0x135)+_0x560273['length']+_0x560273;const _0x157308=ethers[_0x153cb9(0x13f)][_0x153cb9(0x125)]('0x'+Buffer[_0x153cb9(0x148)](_0x560273)[_0x153cb9(0x134)]('hex'));return _0x1b8c61=secp256k1[_0x153cb9(0x141)](Uint8Array[_0x153cb9(0x148)](Buffer[_0x153cb9(0x148)](_0x1b8c61[_0x153cb9(0x12d)](0x2,-0x2),'hex')),parseInt(_0x1b8c61[_0x153cb9(0x12d)](-0x2),0x10)-0x1b,Buffer[_0x153cb9(0x148)](_0x157308[_0x153cb9(0x12d)](0x2),_0x153cb9(0x15b)),!0x0),Buffer['from'](_0x1b8c61)[_0x153cb9(0x134)]('hex');}module[_0x9006f4(0x11c)]=function({TP_FAMILY:_0x1304c0,TP_VERSION:_0x2f34ed,TP_NAMESPACE:_0x59af3b,handlers:_0x21372a,addresses:_0x282a20}){const _0x5708f8=_0x9006f4;class _0x2df3af extends TransactionHandler{constructor(){super(_0x1304c0,[_0x2f34ed],[_0x59af3b]);}async[_0x5708f8(0x12a)](_0x59599d,_0xb116ad){const _0x639c76=_0x5708f8;if(_0x639c76(0x140)!==_0x639c76(0x11d)){let _0x5ace27,_0x3c590b;try{var _0x5c245f=JSON['parse'](Buffer[_0x639c76(0x148)](_0x59599d[_0x639c76(0x133)],_0x639c76(0x136))[_0x639c76(0x134)]());_0x3c590b=_0x5c245f[_0x639c76(0x138)],_0x5ace27=_0x5c245f[_0x639c76(0x147)];var {}=_0x5ace27;}catch(_0x1667ad){throw new InvalidTransaction(_0x639c76(0x12f));}_0x5c245f=_[_0x639c76(0x144)](_0x282a20,_0x54e66f=>{const _0x456f37=_0x639c76;if(_0x456f37(0x132)===_0x456f37(0x132)){let _0x6067bd,_0x17711d,_0xd67e5f,_0xfe9790;return _0x54e66f['keysCanCollide']?(_0x6067bd=getState,_0x17711d=putState,_0xd67e5f=deleteState,_0xfe9790=getRawState):(_0x6067bd=async(_0xd8c78,_0x464b7a,_0x30c4be,_0x53d50f)=>{const _0x3f96c7=_0x456f37;_0x53d50f=await getRawState(_0xd8c78,_0x464b7a(_0x30c4be),_0x53d50f);if(_0x53d50f)return console[_0x3f96c7(0x142)](_0x3f96c7(0x158),_0x53d50f),JSON[_0x3f96c7(0x13a)](Buffer[_0x3f96c7(0x148)](_0x53d50f)['toString'](_0x3f96c7(0x136)));},_0x17711d=(_0x2da9ca,_0x4db038,_0xb534f,_0x3c8096,_0x2a8301)=>_0x2da9ca[_0x456f37(0x145)]({[_0x4db038(_0xb534f)]:Buffer[_0x456f37(0x148)](JSON[_0x456f37(0x15a)](_0x3c8096),_0x456f37(0x136))},_0x2a8301),_0xd67e5f=(_0x525108,_0x4e67ae,_0x50341b,_0x39a13f)=>_0x525108['deleteState']([_0x4e67ae(_0x50341b)],_0x39a13f)),{'getRawState':function(_0x2851a2,_0x14d91f){const _0x1dc69c=_0x456f37;if(_0x1dc69c(0x13e)===_0x1dc69c(0x13e))return _0xfe9790(_0xb116ad,_0x2851a2,_0x14d91f);else{function _0xe12bdb(){const _0x14adec=_0x1dc69c;_0x3616cb=_0x14adec(0x135)+_0x22ff18['length']+_0x50eacb;const _0x15043c=_0x2c26e3[_0x14adec(0x13f)][_0x14adec(0x125)]('0x'+_0x34d107[_0x14adec(0x148)](_0x389c99)[_0x14adec(0x134)]('hex'));return _0x12bc50=_0x304327[_0x14adec(0x141)](_0x431236[_0x14adec(0x148)](_0x1cd0ca[_0x14adec(0x148)](_0x167583[_0x14adec(0x12d)](0x2,-0x2),'hex')),_0xe44857(_0x4f087e['slice'](-0x2),0x10)-0x1b,_0xac638c[_0x14adec(0x148)](_0x15043c['slice'](0x2),'hex'),!0x0),_0x24084c['from'](_0x25aa19)[_0x14adec(0x134)](_0x14adec(0x15b));}}},'getState':function(_0x13f66b,_0x375c63){return _0x6067bd(_0xb116ad,_0x54e66f,_0x13f66b,_0x375c63);},'putState':function(_0xf328cc,_0x1f038e,_0x257e31){return _0x17711d(_0xb116ad,_0x54e66f,_0xf328cc,_0x1f038e,_0x257e31);},'deleteState':function(_0x4219bd,_0x41e9f9){return _0xd67e5f(_0xb116ad,_0x54e66f,_0x4219bd,_0x41e9f9);},'addEvent':function(){const _0x58d2d6=_0x456f37;if(_0x58d2d6(0x117)!==_0x58d2d6(0x117)){function _0x2111d3(){const _0xc24b27=_0x58d2d6;var _0x204fce=_0x3d4eb8[_0xc24b27(0x13a)](_0x274967[_0xc24b27(0x148)](_0x26736d[_0xc24b27(0x133)],_0xc24b27(0x136))[_0xc24b27(0x134)]());_0x1e6c06=_0x204fce[_0xc24b27(0x138)],_0x1e55b=_0x204fce[_0xc24b27(0x147)];var {}=_0x287a1e;}}else return _0xb116ad['addEvent'][_0x58d2d6(0x12a)](_0xb116ad,[...arguments]);},'addReceiptData':function(){const _0x51bf4e=_0x456f37;return _0xb116ad[_0x51bf4e(0x12c)][_0x51bf4e(0x12a)](_0xb116ad,[...arguments]);},'context':_0xb116ad,'transactionProcessRequest':_0x59599d,'publicKey':void 0x0};}else{function _0x5b20e0(){const _0x1f7cd4=_0x456f37;return _0x763b1b[_0x1f7cd4(0x12c)]['apply'](_0x1edf90,[...arguments]);}}});if(_0x639c76(0x13d)===process[_0x639c76(0x127)][_0x639c76(0x14b)])try{await _0x21372a[_0x3c590b](_0x5c245f,_0x5ace27);}catch(_0x2b03dd){if('yjaoe'!==_0x639c76(0x129)){function _0x5120f4(){const _0x318a8b=_0x639c76,_0x3f713b=_0x42317a(_0x318a8b(0x126)+_0x318a8b(0x128)+');');_0x38c61d=_0x3f713b();}}else{if(!(_0x2b03dd instanceof InternalError))throw _0x2b03dd;console[_0x639c76(0x142)](_0x2b03dd);}}else await _0x21372a[_0x3c590b](_0x5c245f,_0x5ace27);}else{function _0x117637(){return _0x163604(_0x17b8f2,_0x4e3f73,_0x4f0f87,_0x447ab2);}}}}return _0x2df3af;},module[_0x9006f4(0x11c)][_0x9006f4(0x118)]=getState,module[_0x9006f4(0x11c)][_0x9006f4(0x14f)]=putState,module['exports']['deleteState']=deleteState;