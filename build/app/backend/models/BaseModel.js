/*! cryptocurrency 2021-05-21 */
const _=require("lodash");class BaseModel{constructor(t){this.type=t}addSignature(t){this.signature=t}toDictionary(){const e={};return Object.keys(this).sort().forEach(t=>{null!==this[t]&&void 0!==this[t]&&(e[t]=this[t])}),e}toObject(t=!1,e=!0){const s=_.cloneDeep(this);return t&&delete s.signature,e&&delete s.type,s}static toSortedObject(s){return Object.keys(s).sort().reduce((t,e)=>(t[e]=s[e],t),{})}toString(t=!1,e=!0){const s=this.toDictionary();return t&&delete s.signature,e&&delete s.type,JSON.stringify(s)}}module.exports=BaseModel;