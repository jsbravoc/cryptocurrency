/*! cryptocurrency 2021-05-22 */
module.exports=Object.freeze({ERRORS:{USER:{INPUT:{NO_INPUT:{errorCode:"100",error:(r,{property:R})=>r.t("ERRORS.USER.INPUT.NO_INPUT.error",{property:R}),msg:(r,{property:R})=>r.t("ERRORS.USER.INPUT.NO_INPUT.msg",{property:R})},MISSING_REQUIRED_INPUT:{errorCode:"100a",error:(r,{parameter:R})=>r.t("ERRORS.USER.INPUT.MISSING_REQUIRED_INPUT.error",{parameter:R}),msg:(r,{parameter:R})=>r.t("ERRORS.USER.INPUT.MISSING_REQUIRED_INPUT.msg",{parameter:R})},INCORRECT_INPUT:{errorCode:"100b",error:(r,{parameter:R})=>r.t("ERRORS.USER.INPUT.INCORRECT_INPUT.error",{parameter:R}),msg:(r,{parameter:R})=>r.t("ERRORS.USER.INPUT.INCORRECT_INPUT.msg",{parameter:R})},INCORRECT_INPUT_TYPE:{errorCode:"110",error:(r,{expectedType:R,receivedType:N,propertyName:e})=>r.t("ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE.error",{expectedType:R,receivedType:N,propertyName:e}),msg:(r,{expectedType:R,receivedType:N,propertyName:e})=>r.t("ERRORS.USER.INPUT.INCORRECT_INPUT_TYPE.msg",{expectedType:R,receivedType:N,propertyName:e})},USER_EXISTS:{errorCode:"111a",error:(r,{address:R})=>r.t("ERRORS.USER.INPUT.USER_EXISTS.error",{address:R}),msg:(r,{address:R})=>r.t("ERRORS.USER.INPUT.USER_EXISTS.msg",{address:R})},USER_DOES_NOT_EXIST:{errorCode:"111b",error:(r,{address:R})=>r.t("ERRORS.USER.INPUT.USER_DOES_NOT_EXIST.error",{address:R}),msg:(r,{address:R})=>r.t("ERRORS.USER.INPUT.USER_DOES_NOT_EXIST.msg",{address:R})},NO_TRANSACTIONS:{errorCode:"112",error:(r,{address:R})=>r.t("ERRORS.USER.INPUT.NO_TRANSACTIONS.error",{address:R}),msg:(r,{address:R})=>r.t("ERRORS.USER.INPUT.NO_TRANSACTIONS.msg",{address:R})},INSUFFICIENT_FUNDS:{errorCode:"113a",error:(r,{address:R})=>r.t("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS.error",{address:R}),msg:(r,{address:R})=>r.t("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS.msg",{address:R})},INSUFFICIENT_FUNDS_PENDING_TRANSACTIONS:{errorCode:"113b",error:(r,{address:R,amountPending:N,actualBalance:e})=>r.t("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_PENDING_TRANSACTIONS.error",{address:R,amountPending:N,actualBalance:e}),msg:(r,{address:R,amountPending:N,actualBalance:e})=>r.t("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_PENDING_TRANSACTIONS.msg",{address:R,amountPending:N,actualBalance:e})},INSUFFICIENT_FUNDS_UNEXPECTED_BALANCE:{errorCode:"114",error:(r,{address:R,actualBalance:N})=>r.t("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_UNEXPECTED_BALANCE.error",{address:R,actualBalance:N}),msg:(r,{address:R,actualBalance:N})=>r.t("ERRORS.USER.INPUT.INSUFFICIENT_FUNDS_UNEXPECTED_BALANCE.msg",{address:R,actualBalance:N})},UNDEFINED_RETURN_TO_REASON:{errorCode:"115",error:(r,{address:R,reason:N})=>r.t("ERRORS.USER.INPUT.UNDEFINED_RETURN_TO_REASON.error",{address:R,reason:N}),msg:(r,{address:R,reason:N})=>r.t("ERRORS.USER.INPUT.UNDEFINED_RETURN_TO_REASON.msg",{address:R,reason:N})}},LOGIC:{USER_IS_NOT_ACTIVE:{errorCode:"121",error:(r,{address:R})=>r.t("ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE.error",{address:R}),msg:(r,{address:R})=>r.t("ERRORS.USER.LOGIC.USER_IS_NOT_ACTIVE.msg",{address:R})},USER_DOES_NOT_HAVE_PERMISSIONS:{errorCode:"121",error:(r,{address:R})=>r.t("ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_PERMISSIONS.error",{address:R}),msg:(r,{address:R})=>r.t("ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_PERMISSIONS.msg",{address:R})},USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS:{errorCode:"122",error:(r,{address:R,recipient:N})=>r.t("ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS.error",{address:R,recipient:N}),msg:(r,{address:R,recipient:N})=>r.t("ERRORS.USER.LOGIC.USER_DOES_NOT_HAVE_TRANSFER_PERMISSIONS.msg",{address:R,recipient:N})},NONEXISTENT_LASTEST_TRANSACTION:{errorCode:"123",error:(r,{address:R,transactionSignature:N})=>r.t("ERRORS.USER.LOGIC.NONEXISTENT_LASTEST_TRANSACTION.error",{address:R,transactionSignature:N}),msg:(r,{address:R,transactionSignature:N})=>r.t("ERRORS.USER.LOGIC.NONEXISTENT_LASTEST_TRANSACTION.msg",{address:R,transactionSignature:N})},NONEXISTENT_PENDING_TRANSACTION:{errorCode:"124",error:(r,{address:R,transactionSignature:N})=>r.t("ERRORS.USER.LOGIC.NONEXISTENT_PENDING_TRANSACTION.error",{address:R,transactionSignature:N}),msg:(r,{address:R,transactionSignature:N})=>r.t("ERRORS.USER.LOGIC.NONEXISTENT_PENDING_TRANSACTION.msg",{address:R,transactionSignature:N})},INCORRECT_RECIPIENT_LASTEST_TRANSACTION:{errorCode:"125",error:(r,{address:R,transactionSignature:N})=>r.t("ERRORS.USER.LOGIC.INCORRECT_RECIPIENT_LASTEST_TRANSACTION.error",{address:R,transactionSignature:N}),msg:(r,{address:R,transactionSignature:N})=>r.t("ERRORS.USER.LOGIC.INCORRECT_RECIPIENT_LASTEST_TRANSACTION.msg",{address:R,transactionSignature:N})},NO_RETURN_TO_ADDRESSES:{errorCode:"126",error:(r,{address:R})=>r.t("ERRORS.USER.LOGIC.NO_RETURN_TO_ADDRESSES.error",{address:R}),msg:(r,{address:R})=>r.t("ERRORS.USER.LOGIC.NO_RETURN_TO_ADDRESSES.msg",{address:R})}}},TRANSACTION:{INPUT:{NO_INPUT:{errorCode:"200",error:(r,{property:R})=>r.t("ERRORS.TRANSACTION.INPUT.NO_INPUT.error",{property:R}),msg:(r,{property:R})=>r.t("ERRORS.TRANSACTION.INPUT.NO_INPUT.msg",{property:R})},MISSING_REQUIRED_INPUT:{errorCode:"200a",error:(r,{parameter:R})=>r.t("ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT.error",{parameter:R}),msg:(r,{parameter:R})=>r.t("ERRORS.TRANSACTION.INPUT.MISSING_REQUIRED_INPUT.msg",{parameter:R})},INCORRECT_INPUT:{errorCode:"200b",error:(r,{parameter:R})=>r.t("ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT.error",{parameter:R}),msg:(r,{parameter:R})=>r.t("ERRORS.TRANSACTION.INPUT.INCORRECT_INPUT.msg",{parameter:R})},TRANSACTION_EXISTS:{errorCode:"211a",error:(r,{signature:R})=>r.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_EXISTS.error",{signature:R}),msg:(r,{signature:R})=>r.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_EXISTS.msg",{signature:R})},TRANSACTION_DOES_NOT_EXIST:{errorCode:"211b",error:(r,{signature:R})=>r.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_DOES_NOT_EXIST.error",{signature:R}),msg:(r,{signature:R})=>r.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_DOES_NOT_EXIST.msg",{signature:R})},TRANSACTION_IS_NOT_PENDING:{errorCode:"212",error:(r,{signature:R})=>r.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_IS_NOT_PENDING.error",{signature:R}),msg:(r,{signature:R})=>r.t("ERRORS.TRANSACTION.INPUT.TRANSACTION_IS_NOT_PENDING.msg",{signature:R})}},LOGIC:{NON_MATCHING_KEYS:{errorCode:"220",error:r=>r.t("ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS.error"),msg:r=>r.t("ERRORS.TRANSACTION.LOGIC.NON_MATCHING_KEYS.msg")},DECRYPTING_ERROR:{errorCode:"221",error:r=>r.t("ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR.error"),msg:r=>r.t("ERRORS.TRANSACTION.LOGIC.DECRYPTING_ERROR.msg")}}}}});