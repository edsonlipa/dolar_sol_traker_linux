var https = require('https');
const fs = require('fs');

var usd_sol="USD_PEN";
var sol_usd="PEN_USD";
let last_value=0;
async function convertCurrency (amount, fromCurrency, toCurrency, cb) {
  var apiKey = 'af7d1220156ee6f1504f';

  fromCurrency = encodeURIComponent(fromCurrency);
  toCurrency = encodeURIComponent(toCurrency);
  var query = fromCurrency + '_' + toCurrency;
  var query_reverse = toCurrency + '_' + fromCurrency;

  var url = 'https://free.currconv.com/api/v7/convert?q='
            + query+','+query_reverse + '&compact=ultra&apiKey=' + apiKey;

  await https.get(url, function(res){
      var body = '';

      res.on('data', function(chunk){
          body += chunk;
      });

      res.on('end', function(){
          try {
            var jsonObj = JSON.parse(body);
            

            var val = jsonObj[query];
            if (val) {
              var total = val * amount;
              var rounded=Math.round(total * 1000) / 1000
              jsonObj[query]=rounded;
              cb(null, rounded);
              let data = JSON.stringify(jsonObj);
              fs.writeFileSync('DolarSol.json', data);
              
            } else {
              var err = new Error("Value not found for " + query);
              console.log(err);
              cb(err);
            }

          } catch(e) {
            console.log("Parse error: ", e);
            cb(e);
          }
      });
  }).on('error', function(e){
        console.log("Got an error: ", e);
        cb(e);
  });
}

//uncomment to test
var exec = require('child_process').exec;
function execute(command, callback){
    exec(command, function(error, stdout, stderr){ callback(stdout); });
};
        
let rawdata = fs.readFileSync('DolarSol.json');
let DolarSol = JSON.parse(rawdata);
last_value=DolarSol[usd_sol];

setInterval(function () {
    var date=new Date();
    var date_str=date.getFullYear()+'/'+date.getMonth()+'/'+date.getDay();
    var time_str=date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
    convertCurrency(1, 'USD', 'PEN', (err, amount)=> {
      if(last_value==amount){
        if(last_value-amount>=0.01){
          execute("notify-send 'Actualizacion de Dolar "+amount+"' 'El precio del Dolar Sol a bajado a las "+time_str+"' -u critical -i face-smile-big",()=>{});
        }else if(amount<3.8){
          execute("notify-send 'Actualizacion de Dolar "+amount+"' 'El precio del Dolar es menor a 3.8 a las "+time_str+"' -u critical -i face-smile-big",()=>{});
        }else if(amount-last_value>=0.01){
          execute("notify-send 'Actualizacion de Dolar "+amount+"' 'El precio del Dolar a subido a las "+time_str+"' -u critical -i face-worried",()=>{});
        }
        console.log('['+date_str+' '+time_str+'] '+usd_sol+' => '+amount);
        last_value=amount;
      }  
      
    });
//}, 1200000);
}, 5000);