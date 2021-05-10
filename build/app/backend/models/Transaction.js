/*! cryptocurrency 2021-05-10 */
const{TYPE}=require("../utils/constants"),BaseModel=require("./BaseModel");class Transaction extends BaseModel{constructor({amount:t,recipient:n,sender:i,description:r,valid:e=!0,valid_thru:s,signature:a,supporting_transactions:o,pending:u,creationDate:c=new Date,creator:p,txid:l}){super(TYPE.TRANSACTION),this.amount=t,this.recipient=n,this.signature=a||l,this.creationDate=c,this.valid=null==e||e,this.creator=p||i||n,null!=i&&(this.sender=i),null!=r&&(this.description=r),null!=s&&(this.valid_thru=new Date(s)),null!=u&&(this.pending=u),null!=o&&(this.supporting_transactions=o)}checkValidity(){return!(new Date(this.valid_thru)<new Date)}toSignatureObject(){var{amount:t,recipient:n,sender:i,creator:r}=this,r={amount:t,recipient:n,sender:i,creator:r};return Transaction.toSortedObject(r)}toSignatureString(){return JSON.stringify(this.toSignatureObject())}addSupportingTransaction(t){this.supporting_transactions&&Array.isArray(this.supporting_transactions)||(this.supporting_transactions=[]),this.supporting_transactions.push(t)}}module.exports=Transaction;