(function(){
  var CHAVE='ond_pais_origem';
  var FUSOS={BR:'Sao_Paulo Bahia Fortaleza Recife Maceio Belem Manaus Cuiaba Campo_Grande Porto_Velho Rio_Branco Boa_Vista Araguaina Santarem Noronha Eirunepe',
    AR:'Buenos_Aires Argentina/',CL:'Santiago Punta_Arenas',UY:'Montevideo',PY:'Asuncion',PE:'Lima',CO:'Bogota',VE:'Caracas',
    MX:'Mexico_City Cancun Merida Monterrey Matamoros Chihuahua Ciudad_Juarez Ojinaga Mazatlan Bahia_Banderas Hermosillo Tijuana',
    US:'New_York Chicago Denver Los_Angeles Phoenix Anchorage Juneau Boise Detroit Indiana/ Kentucky/ North_Dakota/ Menominee Adak Nome Sitka Yakutat Metlakatla Honolulu',
    CA:'Toronto Vancouver Edmonton Winnipeg Halifax St_Johns Regina Moncton Glace_Bay Goose_Bay Whitehorse Dawson Iqaluit Swift_Current',
    PA:'Panama',DO:'Santo_Domingo',PT:'Lisbon Madeira Azores',ES:'Madrid Canary Ceuta',FR:'Paris',IT:'Rome',DE:'Berlin Busingen',GB:'London',
    NL:'Amsterdam',BE:'Brussels',LU:'Luxembourg',AT:'Vienna',HU:'Budapest',CZ:'Prague',CH:'Zurich',PL:'Warsaw',RO:'Bucharest',HR:'Zagreb',
    SI:'Ljubljana',ME:'Podgorica',AL:'Tirane',GR:'Athens',DK:'Copenhagen',NO:'Oslo',SE:'Stockholm',FI:'Helsinki',IS:'Reykjavik',MC:'Monaco',
    TR:'Istanbul',ZA:'Johannesburg',AE:'Dubai',CN:'Shanghai Urumqi',HK:'Hong_Kong',MO:'Macau',JP:'Tokyo',TH:'Bangkok',MA:'Casablanca',
    IL:'Jerusalem Tel_Aviv',PS:'Hebron Gaza',MV:'Maldives'};
  function doFuso(){
    var fuso=''; try{ fuso=Intl.DateTimeFormat().resolvedOptions().timeZone||'' }catch(e){}
    var local=fuso.slice(fuso.indexOf('/')+1);
    for(var pais in FUSOS){
      var nomes=FUSOS[pais].split(' ');
      for(var i=0;i<nomes.length;i++){
        var n=nomes[i];
        if(n.slice(-1)==='/'?local.indexOf(n)===0:local===n) return pais;
      }
    }
    return null;
  }
  function doNavegador(){
    var lista=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||''];
    for(var i=0;i<lista.length;i++){ var m=/[-_]([A-Za-z]{2})$/.exec(lista[i]||''); if(m) return m[1].toUpperCase() }
    return null;
  }
  function salvo(){ try{ return localStorage.getItem(CHAVE) }catch(e){ return null } }
  window.ondPaisVisitante={
    detecta:function(padrao){ return salvo()||doFuso()||doNavegador()||padrao },
    guarda:function(pais){ try{ localStorage.setItem(CHAVE,pais) }catch(e){} },
    nomeador:function(idioma){
      var nomes=null;
      try{ nomes=new Intl.DisplayNames([idioma],{type:'region'}) }catch(e){}
      return function(codigo){ try{ return nomes?nomes.of(codigo):codigo }catch(e){ return codigo } };
    }
  };
})();
