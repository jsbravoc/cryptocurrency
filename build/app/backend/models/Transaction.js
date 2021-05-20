/*! cryptocurrency 2021-05-20 */
const{TYPE}=require("../utils/constants"),BaseModel=require("./BaseModel");class Transaction extends BaseModel{constructor({amount:t,recipient:i,sender:n,description:r,valid:s=!0,valid_thru:e,signature:a,supporting_transactions:o,pending:u,creationDate:c=new Date,creator:h,txid:l}){super(TYPE.TRANSACTION),this.amount=t,this.recipient=i,this.signature=a||l,this.creationDate=c,this.valid=null==s||s,this.creator=h||n||i,null!=n&&(this.sender=n),null!=r&&(this.description=r),null!=e&&(this.valid_thru=new Date(e)),null!=u&&(this.pending=u),null!=o&&(this.supporting_transactions=o)}checkValidity(){return!(this.valid_thru&&new Date(this.valid_thru)<new Date)}toSignatureObject(){var{amount:t,recipient:i,sender:n,creator:r}=this,r={amount:t,recipient:i,sender:n,creator:r};return Transaction.toSortedObject(r)}toSignatureString(){return JSON.stringify(this.toSignatureObject())}addSupportingTransaction(t){this.supporting_transactions&&Array.isArray(this.supporting_transactions)||(this.supporting_transactions=[]),this.supporting_transactions.push(t)}}module.exports=Transaction;