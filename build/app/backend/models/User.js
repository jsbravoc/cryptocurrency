/*! cryptocurrency 2021-05-21 */
const{TYPE,USER_TYPE}=require("../utils/constants"),BaseModel=require("./BaseModel"),Permissions=require("./Permissions");class User extends BaseModel{constructor({address:s,signature:t,role:e,active:n,balance:i,description:r,public_key:a,return_to:o,permissions:c,lastest_transactions:h,pending_transactions:d}){super(TYPE.USER),this.address=s,this.role=e,this.description=r,this.public_key=a,this.balance=i||0,this.active="boolean"!=typeof n||n,this.return_to=o||{},this.lastest_transactions=h||[],this.pending_transactions=d||[],this.permissions=new Permissions(c),this.signature=t||s}removeInvalidTransaction(s){var t=this.lastest_transactions.indexOf(s.signature);if(t<=-1)throw new Error("User error: Tried to remove nonexistent transaction");var{amount:s}=s;this.balance-=s,this.lastest_transactions.splice(t,1)}removePendingTransaction(s){if(Array.isArray(this.pending_transactions)){s=this.pending_transactions.indexOf(s);if(s<=-1)throw new Error("User error: Sender tried to use remove pending unexistent transaction");this.pending_transactions.splice(s,1)}}addTransaction(s,t,e,n=!0){switch(Array.isArray(this.lastest_transactions)||(this.lastest_transactions=[]),s){case USER_TYPE.SENDER:if(n){var i=this.lastest_transactions.indexOf(e);if(i<=-1)throw new Error("User error: Sender tried to use nonexistent transaction");this.balance-=t,this.lastest_transactions.splice(i,1)}else this.pending_transactions.push(e);break;case USER_TYPE.RECIPIENT:n?(this.balance+=t,this.lastest_transactions.push(e)):this.pending_transactions.push(e)}}}module.exports=User;