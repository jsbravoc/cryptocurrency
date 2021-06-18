const{TYPE,USER_TYPE}=require("../utils/constants"),BaseModel=require("./BaseModel"),Permissions=require("./Permissions");class User extends BaseModel{constructor({address:s,role:t,active:n,balance:i,description:a,public_key:e,return_to:r,permissions:o,latest_transactions:c,pending_transactions:l}){super(TYPE.USER,s),this.role=t,this.description=a,this.public_key=e,this.balance=i||0,this.active="boolean"!=typeof n||n,this.return_to=r||{},this.latest_transactions=c||[],this.pending_transactions=l||[],this.permissions=new Permissions(o)}removeInvalidTransaction(s){var t=this.latest_transactions.indexOf(s.address),{amount:s}=s;this.balance-=s,this.latest_transactions.splice(t,1)}removePendingTransaction(s){Array.isArray(this.pending_transactions)&&(s=this.pending_transactions.indexOf(s),this.pending_transactions.splice(s,1))}addTransaction(s,t,n,i=!0){switch(s){case USER_TYPE.SENDER:var a;i?(a=this.latest_transactions.indexOf(n),this.balance-=t,this.latest_transactions.splice(a,1)):this.pending_transactions.push(n);break;case USER_TYPE.RECIPIENT:i?(this.balance+=t,this.latest_transactions.push(n)):this.pending_transactions.push(n)}}toSimplifiedObject(){return{address:this.address,balance:this.balance,latest_transactions:this.latest_transactions.length,pending_transactions:this.pending_transactions.length}}}module.exports=User;