/*! cryptocurrency 2021-05-17 */
const chalk=require("chalk"),SEVERITY={NONE:0,BOLD:1,URL:2,NOTIFY:3,LOW:4,WARN:5,ERROR:6,SUCCESS:7},formatMessage=(a,e=0)=>{let t;const l=new Date;var o=chalk.white.bgBlue(`CNK-VALIDATOR | ${l.toLocaleDateString("en-US",{month:"long",day:"numeric",hour:"2-digit",minute:"2-digit",second:"2-digit"})} `);switch(e){case SEVERITY.SUCCESS:t=`${o} ${chalk.green(a)}`;break;case SEVERITY.ERROR:t=`${o} ${chalk.red(a)}`;break;case SEVERITY.WARN:t=`${o} ${chalk.yellow(a)}`;break;case SEVERITY.LOW:t=`${o} ${chalk.magenta(a)}`;break;case SEVERITY.NOTIFY:t=`${o} ${chalk.bold(a)}`;break;case SEVERITY.URL:var r=a.match("(http|https)://(([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9]).)*([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])(:[0-9]+)?$");a=a.replace(r[0],""),t=`${o} ${a}${chalk.underline.blue(r[0])}`;break;case SEVERITY.BOLD:t=`${o} ${chalk.bold(a)}`;break;case SEVERITY.NONE:default:t=`${o} ${a}`}return t},logFormatted=(a,e=0,t=null)=>{t?console.log(formatMessage(a,e),t):console.log(formatMessage(a,e))};module.exports={SEVERITY:SEVERITY,formatMessage:formatMessage,logFormatted:logFormatted};