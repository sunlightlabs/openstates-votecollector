/**
 * Retrieves bill and vote information from the Open States API
 * To use, create two named ranges that include a two letter state abbrev
 * and a bill category. For more information see:
 * 
 */

function collectVotes(){

  var NameParse=function(){function e(){return e}e.parse=function(e){e=e.trim();var t=[];var n="";var r="";var i="";var s=null;var o=0;var u=0;t=e.split(" ").filter(function(e){return e.indexOf("(")===-1});var a=t.length;var f=this.is_salutation(t[0]);var l=this.is_suffix(t[a-1]);var c=f?1:0;var h=l?a-1:a;s=t[c];if(this.is_initial(s)){if(this.is_initial(t[c+1])){r+=" "+s.toUpperCase()}else{i+=" "+s.toUpperCase()}}else{r+=" "+this.fix_case(s)}for(u=c+1;u<h-1;u++){s=t[u];if(this.is_compound_lastName(s)){break}if(this.is_initial(s)){i+=" "+s.toUpperCase()}else{r+=" "+this.fix_case(s)}}if(h-c>1){for(o=u;o<h;o++){n+=" "+this.fix_case(t[o])}}return{salutation:f||"",firstName:r.trim(),initials:i.trim(),lastName:n.trim(),suffix:l||""}};e.removeIgnoredChars=function(e){return e.replace(".","")};e.is_salutation=function(e){e=this.removeIgnoredChars(e).toLowerCase();if(e==="mr"||e==="master"||e==="mister"){return"Mr."}else if(e==="mrs"){return"Mrs."}else if(e==="miss"||e==="ms"){return"Ms."}else if(e==="dr"){return"Dr."}else if(e==="rev"){return"Rev."}else if(e==="fr"){return"Fr."}else{return false}};e.is_suffix=function(e){e=this.removeIgnoredChars(e).toLowerCase();var t=["I","II","III","IV","V","Senior","Junior","Jr","Sr","PhD","APR","RPh","PE","MD","MA","DMD","CME","BVM","CFRE","CLU","CPA","CSC","CSJ","DC","DD","DDS","DO","DVM","EdD","Esq","JD","LLD","OD","OSB","PC","Ret","RGS","RN","RNC","SHCJ","SJ","SNJM","SSMO","USA","USAF","USAFR","USAR","USCG","USMC","USMCR","USN","USNR"];var n=t.map(function(e){return e.toLowerCase()}).indexOf(e);if(n>=0){return t[n]}else{return false}};e.is_compound_lastName=function(e){e=e.toLowerCase();var t=["vere","von","van","de","del","della","di","da","pietro","vanden","du","st.","st","la","lo","ter"];return t.indexOf(e)>=0};e.is_initial=function(e){e=this.removeIgnoredChars(e);return e.length===1};e.is_camel_case=function(e){var t=/[A-Z]+/;var n=/[a-z]+/;return t.exec(e)&&n.exec(e)};e.fix_case=function(e){e=this.safe_ucfirst("-",e);e=this.safe_ucfirst(".",e);return e};e.safe_ucfirst=function(e,t){return t.split(e).map(function(e){if(this.is_camel_case(e)){return e}else{return e.substr(0,1).toUpperCase()+e.substr(1).toLowerCase()}},this).join(e)};return e}()
   
  var start_row;
  var end_row;
  var total_rows;
  var column;
  var leg_list = [];
  
  function getState(spreadsheet){
    var state = spreadsheet.getRangeByName("state")
    if (state != null) { return state.getValue(); }
    else { return '';}
  };
  
  function getCategory(spreadsheet) {
    var category = spreadsheet.getRangeByName("category")
    if ( category != null) { 
      return category.getValue();
    } else { return ""; }
  };

  function getBills(spreadsheet){
    return spreadsheet.getRangeByName("bills");
  };
  
  function getLegislators(spreadsheet, state, api_key){
  
    var legislators = {};
    var legislator_names = spreadsheet.getRangeByName("legislators")
    
    if (legislator_names != null) {   
      var leg_values = legislator_names.getValues();
      start_row = legislator_names.getRow();
      end_row = legislator_names.getLastRow();
      total_rows = legislator_names.getNumRows();
      column = legislator_names.getColumn(); //only expecting one
      
  
      for (l = 0; l < total_rows; l++){
        var name = leg_values[l][0];
        var leg = Utilities.jsonParse(UrlFetchApp.fetch("http://openstates.org/api/v1/legislators/?state=" + state + "&apikey=" + api_key + "&full_name=" + name).getContentText());
        if (leg.length == 1){
          //worked out
          leg[0]['index'] = parseInt(start_row + l);
          legislators[leg[0]['leg_id']] = leg[0];      
          leg_list.push(leg[0]['leg_id']);
        } else {
          var last_name = NameParse.parse(name)['lastName'];
          leg = Utilities.jsonParse(UrlFetchApp.fetch("http://openstates.org/api/v1/legislators/?state=" + state + "&apikey=" + api_key + "&last_name=" + last_name).getContentText());        
          if (leg.length == 1) {
            //worked out
            leg[0]['index'] = parseInt(start_row + l);
            legislators[leg[0]['leg_id']] = leg[0];
            leg_list.push(leg[0]['leg_id']);
          } 
          else{
            var first_name = NameParse.parse(name)['firstName'];
            leg = Utilities.jsonParse(UrlFetchApp.fetch("http://openstates.org/api/v1/legislators/?state=" + state + "&apikey=" + api_key + "&last_name=" + last_name + "&first_name=" + first_name).getContentText());        
            if (leg.length == 1) {
              //worked out
              leg[0]['index'] = parseInt(start_row + l);
              legislators[leg[0]['leg_id']] = leg[0];
              leg_list.push(leg[0]['leg_id']);
            } else {
              //show blanks
              Logger.log("Couldn't find record for last name " + last_name);
            };
          };
        }      
      };
    } else {
      //no legislators provided, so use all
      var all_leg = Utilities.jsonParse(UrlFetchApp.fetch("http://openstates.org/api/v1/legislators/?state=" + state + "&apikey=" + api_key).getContentText());
      start_row = 5;
      column = 1;
      total_rows = all_leg.length;
      end_row = start_row + total_rows;
      
      for (l in all_leg){
        legislators[all_leg[l]['leg_id']] = all_leg[l];
        legislators[all_leg[l]['leg_id']]['index'] = parseInt(l) + start_row;
        leg_list.push(all_leg[l]['leg_id']);
      }
      
    }
    return legislators;
  };


  var api_key = "6f667b9f2a1942038de1b7b7f3923963";

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var state = getState(spreadsheet);
  var category = getCategory(spreadsheet);
  var bills = getBills(spreadsheet);

  
  if (category == '' && bills == null) {
    var bla = Browser.msgBox("You must define a named range for either a category or specific bill numbers you want to retrieve.", Browser.Buttons.OK);
    return;
  }
  
  if ( state == '') {
    var bla = Browser.msgBox("You must defined a named range named 'state' that contains a two letter US state abbreviation", Browser.Buttons.OK);
    return;
  }
 
  var legislators = getLegislators(spreadsheet, state, api_key);
  var bill_list = [];
  var bill_votes = {};
  
  
  var session = spreadsheet.getRangeByName("session");
  if( session == null ) {
    session = "" //will default to current
  } else {
    session = ":" + session.getValue();
  }
  
  var bill_search_endpoint = "http://openstates.org/api/v1/bills/?state=" + state + "&apikey=" + api_key + "&subject=" + category + "&search_window=session" + session + "&fields=bill_id,votes,chamber,subjects,session";
  var bill_detail_endpoint = "http://openstates.org/api/v1/bills/" + state + "/";
  var bill_group_endpoint = "http://openstates.org/api/v1/bills/?apikey=" + api_key + "&state=" + state + "&search_window=session" + session + "&fields=bill_id,votes,chamber,subjects,session,votes.motion,votes.yes_votes,votes.no_votes,votes.other_votes";


  if( bills == null) { 
  
    Utilities.sleep(1000);
  
    var subflag = false;
    var state_metadata = Utilities.jsonParse(UrlFetchApp.fetch("http://openstates.org/api/v1/metadata/" + state + "?apikey=" + api_key).getContentText());
    for( i in state_metadata['feature_flags']){
      if (state_metadata['feature_flags'][i] == 'subjects'){
        Logger.log("has subjects");
        subflag = true;
      }
    }
    
    if (subflag == false) {
      Browser.msgBox("This state does not currently provide bill subjects. Please specify bill ids to use the script or choose another state.");
      return;
    }
    
    //get bills for this category
    Logger.log(bill_search_endpoint);
    var bills = Utilities.jsonParse(UrlFetchApp.fetch(bill_search_endpoint).getContentText());
  
    //get all bills with at least one vote
    for (b = 0; b < bills.length; b++){ 
      if (bills[b]['votes'].length > 0) {
        var bill = Utilities.jsonParse(UrlFetchApp.fetch(bill_detail_endpoint + bills[b]['session'] + "/" + bills[b]['bill_id'] + "?apikey=" + api_key).getContentText());
        bill_list.push(bill['bill_id']);
        
        var vote = bill['votes'][bill['votes'].length-1]; //get last vote, ordered by date
        var yes_votes = vote['yes_votes'];
        var no_votes = vote['no_votes'];
        var other_votes = vote['other_votes'];
        
        bill_votes[bill['bill_id']] = {
          'session': bills[b]['session'],
          'motion': vote['motion'],
          'chamber': vote['chamber'],
          'yes_votes': yes_votes,
          'no_votes': no_votes,
          'other_votes': other_votes
        };        
      };
    };
  } else {
    //filter by specific bills
    var bill_names = bills.getValues()[0];
    for (b in bill_names){
    
      var bill_num = bill_names[b].replace(/\(.*\)/, '').trim();  //remove the vote parenthetical if it exists
      bill_num = bill_num.replace(/\./g,"");
      var bill = Utilities.jsonParse(UrlFetchApp.fetch(bill_group_endpoint + "&bill_id=" + encodeURIComponent(bill_num)).getContentText())[0];

      if(bill['votes'].length > 0) {
        Logger.log(bill["votes"]);
        bill_list.push(bill['bill_id']);
        var vote = bill['votes'][0]; //get last vote, ordered by date
        //Logger.log(vote);
        var yes_votes = vote['yes_votes'];
        var no_votes = vote['no_votes'];
        var other_votes = vote['other_votes'];
        
        bill_votes[bill['bill_id']] = {
          'session': bill['session'],
          'motion': vote['motion'],
          'chamber': bill['chamber'],
          'yes_votes': yes_votes,
          'no_votes': no_votes,
          'other_votes': other_votes
        };        
      }
    }
  
  };
  
  
  var ss = spreadsheet.getSheets()[0];
  
  //set headers
  ss.getRange(start_row - 1, column + 1).setValue('District');
  ss.getRange(start_row - 1, column + 2).setValue('Chamber');
  ss.getRange(start_row - 1, column + 3).setValue('Party');
  
  ss.getRange(end_row + 2, column).setValue('Yes Votes');
  ss.getRange(end_row + 3, column).setValue('No Votes');
  ss.getRange(end_row + 4, column).setValue('Other Votes');
    
  //set legislator info
  for (var l in leg_list) {
    var this_leg = legislators[leg_list[l]];
    ss.getRange(this_leg['index'], column + 1).setValue(this_leg['district']);
    ss.getRange(this_leg['index'], column + 2).setValue(this_leg['chamber']);
    ss.getRange(this_leg['index'], column + 3).setValue(this_leg['party']);
    // link up legislators, replace with full name
    ss.getRange(this_leg['index'], column).setValue( "=HYPERLINK(\"http://openstates.org/" + state.toLowerCase() + "/legislators/" + this_leg['leg_id'] + "/" + this_leg['full_name'].replace(/\s/g, '-').replace(/"/g, '') + "/\", \"" + this_leg['full_name'].replace(/"/g, '') + "\")");
    
  };

  //set bill headers and votes
  for (b = 0; b < bill_list.length; b++){
  
    //link up bills, put status in parens    
    var this_bill = bill_votes[bill_list[b]];
    var cell = ss.getRange(start_row - 1, column + 4 + b).setValue("=HYPERLINK(\"http://openstates.org/" + state.toLowerCase() + "/bills/" + this_bill['session'] + "/" + bill_list[b] + "\", \"" + bill_list[b] + " (" + this_bill['motion'] + ", " + this_bill['chamber'] + " chamber)" + "\")");

    var ycount = 0;
    var ncount = 0;
    var ocount = 0;
    
    for (yv in this_bill['yes_votes']){
      var vote = this_bill['yes_votes'][yv];
      var voter = legislators[vote['leg_id']];
      if (voter != undefined){
        ss.getRange( voter['index'] , column + b + 4 ).setValue("yes");
        ycount = ycount + 1;
      }
    };
    
    for (nv in this_bill['no_votes']) {
      var vote = this_bill['no_votes'][nv];
      var voter = legislators[vote['leg_id']];
      if (voter != undefined){
        ss.getRange( voter['index'] , column + b + 4 ).setValue("no");
        ncount = ncount + 1;
      }
    };
    
   for (ov in this_bill['other_votes']) {
      var vote = this_bill['other_votes'][ov];
      var voter = legislators[vote['leg_id']];
      if (voter != undefined){
        ss.getRange( voter['index'] , column + b + 4 ).setValue("other");
        ocount = ocount + 1;
      }
    };
    
    //Show vote tallies for this bill
    ss.getRange(end_row + 2, column + b + 4).setValue(ycount);
    ss.getRange(end_row + 3, column + b + 4).setValue(ncount);
    ss.getRange(end_row + 4, column + b + 4).setValue(ocount);
    
  };
};
