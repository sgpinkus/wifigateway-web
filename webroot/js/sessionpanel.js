/**
 * JS for sessionpanel.html. Tightly coupled to that.
 */
var state;
var statTimerId;
var updateTimerId;
var comm_err_count = 0;

jQuery(document).ready(function()
{
  //p = new Panel();
  console.log("Panel init");
  jQuery("#ajax_strobe").ajaxStart(function(){this.src = "/images/loading.gif";});
  jQuery("#ajax_strobe").ajaxStop(function(){this.src = "";});
  pause_button = jQuery("#pause_button").click(function(){pause_session(null);});
  end_button = jQuery("#end_button").click(function(){end_session(null);});
  set_msg("requesting session start");   
  set_state("starting");
  start_session();
  // Bind adaptor callbacks.
  jQuery(document).bind("msg", set_msg_event);
  jQuery(document).bind("comm_err", comm_err_event);
  jQuery(document).bind("start_session_cb", start_session_cb);
  jQuery(document).bind("update_session_cb", update_session_cb);
  jQuery(document).bind("play_session_cb", play_session_cb);
  jQuery(document).bind("pause_session_cb", pause_session_cb);
  jQuery(document).bind("end_session_cb", end_session_cb);
  jQuery(document).bind("stats_cb", stats_cb);
});

/**
 * Note result is json-rpc response in the following.
 * result.result === 0 
 */

/**
 * stats() poll must start after starting state exits successfully.
 */
function start_session_cb(e, result)
{
  console.log("sessionpanel::start_session_cb", result);
  if(result.error)
  {
    jQuery(document).trigger("msg", "start failed");
    setTimeout(function(){window.location = "index.html"}, 3000);
  }
  else
  {
    // JS passes in random params if you dont set them explicitly!
    //statTimerId = setInterval(stats, 3000, null);
    updateTimerId = setInterval(update_session, 5000, null);
  }
  stats();
}

function update_session_cb(e, result)
{
  //console.log("sessionpanel::update_session_cb")
  if(result.error)
  {
    jQuery(document).trigger("msg", "keep alive failed");
    setTimeout(function(){window.location = "index.html"}, 3000);
  }
  else
  {
    jQuery(document).trigger("msg", "keep alive ok");
  }
  stats();
}

function pause_session_cb(e, result)
{
  if(result.error)
  {
    jQuery(document).trigger("msg","pause session failed");
  }
  stats();
}

function play_session_cb(e, result)
{
  if(result.error)
  {
    jQuery(document).trigger("msg","play session failed");
  }
  stats();
}

function end_session_cb(e, result)
{
  if(result.error)
  {
    jQuery(document).trigger("msg","end session failed");
  }
  stats();
}

function stats_cb(e, result)
{
  console.log("sessionpanel::stat_cb: result=", result);
  if(result.error)
  {
    return;
  }
  result = result.result;
  //console.log(result);
  var timeRemaining = parseInt(result.stats.timeRemaining);
  var sessionTime = parseInt(result.stats.sessionTime);
  var quotaRemaining = parseInt(result.stats.quotaRemaining);
  var bandwidth = parseInt(result.stats.bandwidth);
  var pauseTimeRemaining = parseInt(result.stats.pauseTimeRemaining);
  
  jQuery("#time_used").text(sessionTime);
  jQuery("#quota_used").text(quotaRemaining)
  jQuery("#bandwidth").text(bandwidth);
  jQuery("#pause_time_left").text(pauseTimeRemaining);
  set_state(state_code_to_string(result.stats.state));
}
 
/**
 * Handle all state ins and outs here.
 * "starting" state should be set once on init called once.
 * @todo even with simple states state frames make things better.
 */
function set_state(new_state)
{
  console.log("sessionpanel::set_state", "State change called with '" + new_state + "'");
  switch(new_state)
  {
    case "starting" :
    {
      console.log("state to starting");
      state = "starting";
      set_status("Starting");
      jQuery("#pause_time_stat").hide();
      jQuery("#pause_button").hide();
      jQuery("#end_button").hide();
      break;
    }
    case "uninitialized" :
    {
      if(state !=  "uninitialized")
      {
        console.log("state to uninitialized");
        state = "uninitialized";
        set_status("Uninitialized");
        jQuery("#pause_time_stat").hide();
        jQuery("#pause_button").hide();
        jQuery("#end_button").hide();
        setTimeout(function(){window.location = "index.html"}, 2000);
      }
      break;
    }
    case "started" :
    {
      if(state != "started")
      {
        console.log("state to started");            
        state = "started";
        set_status("Started");
        jQuery("#pause_time_stat").hide();
        jQuery("#pause_button").text("pause");
        jQuery("#pause_button").click(function(){pause_session(null);});
        jQuery("#pause_button").show();
        jQuery("#end_button").show();
      }
      break;
    }
    case "paused" :
    {
      if(state != "paused")
      {
        console.log("state to paused");
        state = "paused";
        set_status("Paused");
        jQuery("#pause_time_stat").show();
        jQuery("#pause_button").text("play");
        jQuery("#pause_button").click(function(){play_session(null);});
        jQuery("#end_button").show();
      }
      break;
    }
    case "exhausted" :
    case "ended" :
    {
      if(state != "ended")
      {
        console.log("state to ended");
        state = "ended";
        set_status("Ended");
        set_msg(null, "session has ended. Thx.");
        jQuery("#pause_time_stat").hide();
        jQuery("#pause_button").hide();
        jQuery("#end_button").hide();
      }
      break;
    }
    default :
    {
      console.log("Unknown state set!");
    }
  }
}

function set_status(status)
{
  jQuery("#status_text").text(status);
}
      
function set_msg(msg)
{
  var newMsg = jQuery("<li>" + msg + "</li>");
  //console.log(jQuery("#message_list").html());
  jQuery("#message_list").append(newMsg).fadeIn(2000);
  setTimeout(function(){newMsg.remove();}, 2000);
}
  
function comm_err(error)
{
  msg = error.message ? error.message : "unspecified";
  set_msg("communication error occured: " + msg);
  console.log("communication error occured: " + msg);
  comm_err_count++;
  if(comm_err_count > 100)
  {
    //window.location = "index.html";
  }
}

function set_msg_event(e,msg)
{
  e.stopPropagation();
  set_msg(msg);
}

function comm_err_event(e)
{
  e.stopPropagation();
  comm_err();
}