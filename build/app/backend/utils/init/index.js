/*! cryptocurrency 2021-05-17 */
String.prototype.toProperCase=function(){return this.replace(/\w\S*/g,function(r){return r.charAt(0).toUpperCase()+r.substr(1).toLowerCase()})};