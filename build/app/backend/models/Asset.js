const{TRANSACTION_FAMILY,TRANSACTION_FAMILY_VERSION}=require("../utils/constants");class Asset{constructor({transactionFamily:t=TRANSACTION_FAMILY,transactionFamilyVersion:s=TRANSACTION_FAMILY_VERSION,inputs:i,outputs:a,payload:n}){this.transactionFamily=t,this.transactionFamilyVersion=s,this.inputs=i,this.outputs=a,this.payload=n}}module.exports=Asset;