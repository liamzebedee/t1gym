import * as ss from 'simple-statistics'

export function calcStats(sgvData) {
  let displayUnits = ''
  let clientOpts = {
      bgHigh: 260
  , bgTargetTop: 180
  , bgTargetBottom: 80
  , bgLow: 55
  }

  let options = {}
  options.targetLow = clientOpts.bgTargetBottom
  options.targetHigh = clientOpts.bgTargetTop
  // options.raw = $('#rp_optionsraw').is(':checked');
  // options.iob = $('#rp_optionsiob').is(':checked');
  // options.cob = $('#rp_optionscob').is(':checked');
  // options.openAps = $('#rp_optionsopenaps').is(':checked');
  // options.predicted = $('#rp_optionspredicted').is(':checked');
  // options.predictedTruncate = $('#rp_optionsPredictedTruncate').is(':checked');
  // options.basal = $('#rp_optionsbasal').is(':checked');
  // options.notes = $('#rp_optionsnotes').is(':checked');
  // options.food = $('#rp_optionsfood').is(':checked');
  // options.insulin = $('#rp_optionsinsulin').is(':checked');
  // options.insulindistribution = $('#rp_optionsdistribution').is(':checked');
  // options.carbs = $('#rp_optionscarbs').is(':checked');
  // options.scale = ( $('#rp_linear').is(':checked') ? report_plugins.consts.SCALE_LINEAR : report_plugins.consts.SCALE_LOG );
  // options.weekscale = ( $('#wrp_linear').is(':checked') ? report_plugins.consts.SCALE_LINEAR : report_plugins.consts.SCALE_LOG );
  // options.order = ( $('#rp_oldestontop').is(':checked') ? report_plugins.consts.ORDER_OLDESTONTOP : report_plugins.consts.ORDER_NEWESTONTOP );
  // options.width = parseInt($('#rp_size :selected').attr('x'));
  // options.weekwidth = parseInt($('#wrp_size :selected').attr('x'));
  // options.height = parseInt($('#rp_size :selected').attr('y'));
  // options.weekheight = parseInt($('#wrp_size :selected').attr('y'));
  // options.loopalyzer = $("#loopalyzer").hasClass( "selected" ); // We only want to run through Loopalyzer if that tab is selected

  var stats = [];
  var enabledHours = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];

  let data = sgvData.filter(function(r) {
    if (r.type) {
      return r.type === 'sgv';
    } else {
      return true;
    }
  }).map(function (r) { 
    var ret = {};
    ret.sgv = parseFloat(r.sgv); 
    ret.bgValue = parseInt(r.y);
    ret.displayTime = r.date;
    return {
      sgv: parseFloat(r.sgv),
      bgValue: parseInt(r.sgv),
      displayTime: new Date(r.date),
    }
  })
  
  // Filter data for noise
  // data cleaning pass 0 - remove duplicates and non-sgv entries, sort
  var seen = [];
  data = data.filter(function(item) {
    if (!item.sgv || !item.bgValue || !item.displayTime || item.bgValue < 39) {
      // console.log(item);
      return false;
    }
    return seen.includes(item.displayTime) ? false : (seen[item.displayTime] = true);
  });

  data.sort(function(a, b) {
    return a.displayTime.getTime() - b.displayTime.getTime();
  });

  var glucose_data = [data[0]];

  if (data.length === 0) {
      // console.log(data.length)
  //   $('#glucosedistribution-days').text(translate('Result is empty'));
    return;
  }

  // data cleaning pass 1 - add interpolated missing points
  for (let i = 0; i <= data.length - 2; i++) {
    var entry = data[i];
    var nextEntry = data[i + 1];

    var timeDelta = nextEntry.displayTime.getTime() - entry.displayTime.getTime();

    if (timeDelta < 9 * 60 * 1000 || timeDelta > 25 * 60 * 1000) {
      glucose_data.push(entry);
      continue;
    }

    var missingRecords = Math.floor(timeDelta / (5 * 60 * 990)) - 1;

    var timePatch = Math.floor(timeDelta / (missingRecords + 1));
    var bgDelta = (nextEntry.bgValue - entry.bgValue) / (missingRecords + 1);

    glucose_data.push(entry);

    for (var j = 1; j <= missingRecords; j++) {
      var bg = Math.floor(entry.bgValue + bgDelta * j);
      var t = new Date(entry.displayTime.getTime() + j * timePatch);
      var newEntry = {
        sgv: bg
        , bgValue: bg
        , displayTime: t
      };
      glucose_data.push(newEntry);
    }
  }
  // Need to add the last record, after interpolating between points
  glucose_data.push(data[data.length - 1]);

  // data cleaning pass 2 - replace single jumpy measures with interpolated values
  var glucose_data2 = [glucose_data[0]];
  var prevEntry = glucose_data[0];

  const maxGap = (5 * 60 * 1000) + 10000;

  for (let i = 1; i <= glucose_data.length - 2; i++) {
    let entry = glucose_data[i];
    let nextEntry = glucose_data[i + 1];

    let timeDelta = nextEntry.displayTime.getTime() - entry.displayTime.getTime();
    let timeDelta2 = entry.displayTime.getTime() - prevEntry.displayTime.getTime();

    if (timeDelta > maxGap || timeDelta2 > maxGap) {
      glucose_data2.push(entry);
      prevEntry = entry;
      continue;
    }

    var delta1 = entry.bgValue - prevEntry.bgValue;
    var delta2 = nextEntry.bgValue - entry.bgValue;

    if (delta1 <= 8 && delta2 <= 8) {
      glucose_data2.push(entry);
      prevEntry = entry;
      continue;
    }

    if ((delta1 > 0 && delta2 < 0) || (delta1 < 0 && delta2 > 0)) {
      const d = (nextEntry.bgValue - prevEntry.bgValue) / 2;
      const interpolatedValue = prevEntry.bgValue + d;

      let newEntry = {
        sgv: interpolatedValue
        , bgValue: interpolatedValue
        , displayTime: entry.displayTime
      };
      glucose_data2.push(newEntry);
      prevEntry = newEntry;
      continue;
    }

    glucose_data2.push(entry);
    prevEntry = entry;
  }
  // Need to add the last record, after interpolating between points
  glucose_data2.push(glucose_data[glucose_data.length - 1]);

  glucose_data = data = glucose_data2.filter(function(r) {
    return enabledHours[new Date(r.displayTime).getHours()]
  });

  glucose_data.sort(function(a, b) {
    return a.displayTime.getTime() - b.displayTime.getTime();
  });

  var timeTotal = 0;
  for (let i = 1; i <= glucose_data.length - 2; i++) {
    let entry = glucose_data[i];
    let nextEntry = glucose_data[i + 1];
    let timeDelta = nextEntry.displayTime.getTime() - entry.displayTime.getTime();
    if (timeDelta < maxGap) {
      timeTotal += timeDelta;
    }
  }

  var daysTotal = timeTotal / (1000 * 60 * 60 * 24);
  
  let result = {};

  ['Low', 'Normal', 'High'].forEach(function(range) {
    result[range] = {};
    var r = result[range];
    r.rangeRecords = glucose_data.filter(function(r) {
      if (range === 'Low') {
        return r.sgv > 0 && r.sgv < options.targetLow;
      } else if (range === 'Normal') {
        return r.sgv >= options.targetLow && r.sgv < options.targetHigh;
      } else {
        return r.sgv >= options.targetHigh;
      }
    });
    stats.push(r.rangeRecords.length);
    r.rangeRecords.sort(function(a, b) {
      return a.sgv - b.sgv;
    });
    r.localBgs = r.rangeRecords.map(function(r) {
      return r.sgv;
    }).filter(function(bg) {
      return !!bg;
    });
    r.midpoint = Math.floor(r.rangeRecords.length / 2);
    r.readingspct = (100 * r.rangeRecords.length / data.length).toFixed(1);
    if (r.rangeRecords.length > 0) {
      r.mean = Math.floor(10 * ss.mean(r.localBgs)) / 10;
      r.median = r.rangeRecords[r.midpoint].sgv;
      r.stddev = Math.floor(ss.standardDeviation(r.localBgs) * 10) / 10;
    }

    // Too much data!
    delete r.rangeRecords
    delete r.localBgs
  });

  // make sure we have total 100%
  result.Normal.readingspct = (100 - result.Low.readingspct - result.High.readingspct).toFixed(1);

  // ['Low', 'Normal', 'High'].forEach(function(range) {
  //   var tr = $('<tr>');
  //   var r = result[range];

  //   var rangeExp = '';
  //   if (range == 'Low') {
  //     rangeExp = ' (<' + options.targetLow + ')';
  //   }
  //   if (range == 'High') {
  //     rangeExp = ' (>=' + options.targetHigh + ')';
  //   }

  //   var rangeLabel = range;
  //   if (rangeLabel == 'Normal') rangeLabel = 'In Range';

  //   $('<td class="tdborder" style="background-color:' + tablecolors[range] + '"><strong>' + translate(rangeLabel) + rangeExp + ': </strong></td>').appendTo(tr);
  //   $('<td class="tdborder">' + r.readingspct + '%</td>').appendTo(tr);
  //   $('<td class="tdborder">' + r.rangeRecords.length + '</td>').appendTo(tr);
  //   if (r.rangeRecords.length > 0) {
  //     $('<td class="tdborder">' + r.mean.toFixed(1) + '</td>').appendTo(tr);
  //     $('<td class="tdborder">' + r.median.toFixed(1) + '</td>').appendTo(tr);
  //     $('<td class="tdborder">' + r.stddev.toFixed(1) + '</td>').appendTo(tr);
  //     $('<td> </td>').appendTo(tr);
  //   } else {
  //     $('<td class="tdborder">N/A</td>').appendTo(tr);
  //     $('<td class="tdborder">N/A</td>').appendTo(tr);
  //     $('<td class="tdborder">N/A</td>').appendTo(tr);
  //     $('<td class="tdborder"> </td>').appendTo(tr);
  //   }

  //   table.append(tr);
  // });

  // var tr = $('<tr>');
  // $('<td class="tdborder"><strong>' + translate('Overall') + ': </strong></td>').appendTo(tr);
  // $('<td> </td>').appendTo(tr);
  // $('<td class="tdborder">' + glucose_data.length + '</td>').appendTo(tr);
  // if (glucose_data.length > 0) {
  //   var localBgs = glucose_data.map(function(r) {
  //     return r.sgv;
  //   }).filter(function(bg) {
  //     return !!bg;
  //   });
    var mgDlBgs = glucose_data.map(function(r) {
      return r.bgValue;
    }).filter(function(bg) {
      return !!bg;
    });
  //   $('<td class="tdborder">' + (Math.round(10 * ss.mean(localBgs)) / 10).toFixed(1) + '</td>').appendTo(tr);
  //   $('<td class="tdborder">' + (Math.round(10 * ss.quantile(localBgs, 0.5)) / 10).toFixed(1) + '</td>').appendTo(tr);
  //   $('<td class="tdborder">' + (Math.round(ss.standard_deviation(localBgs) * 10) / 10).toFixed(1) + '</td>').appendTo(tr);
  //   $('<td class="tdborder"><center>' + (Math.round(10 * (ss.mean(mgDlBgs) + 46.7) / 28.7) / 10).toFixed(1) + '%<sub>DCCT</sub> | ' + Math.round(((ss.mean(mgDlBgs) + 46.7) / 28.7 - 2.15) * 10.929) + '<sub>IFCC</sub></center></td>').appendTo(tr);
  // } else {
  //   $('<td class="tdborder">N/A</td>').appendTo(tr);
  //   $('<td class="tdborder">N/A</td>').appendTo(tr);
  //   $('<td class="tdborder">N/A</td>').appendTo(tr);
  //   $('<td class="tdborder">N/A</td>').appendTo(tr);
  // }
  // table.append(tr);
  // report.append(table);

  // Stability
  var t1 = 6;
  var t2 = 11;
  var t1count = 0;
  var t2count = 0;

  var events = 0;

  var GVITotal = 0;
  var GVIIdeal = 0;
  var GVIIdeal_Time = 0;

  var RMSTotal = 0;

  var usedRecords = 0;
  var glucoseTotal = 0;
  var deltaTotal = 0;

  for (let i = 0; i <= glucose_data.length - 2; i++) {
    const entry = glucose_data[i];
    const nextEntry = glucose_data[i + 1];
    const timeDelta = nextEntry.displayTime.getTime() - entry.displayTime.getTime();

    // Use maxGap constant
    if (timeDelta == 0 || timeDelta > maxGap) { // 6 * 60 * 1000) {
      // console.log("Record skipped");
      continue;
    }

    usedRecords += 1;
    events += 1;

    var delta = Math.abs(nextEntry.bgValue - entry.bgValue);
    deltaTotal += delta;

    if (delta > 0) { // avoid divide by 0 error
      // Are we rising at faster than 5mg/DL/5minutes
      if ((delta / timeDelta) >= (t1 / (1000 * 60 * 5))) {
        t1count += 1;
      }
      // Are we rising at faster than 10mg/DL/5minutes
      if ((delta / timeDelta) >= (t2 / (1000 * 60 * 5))) {
        t2count += 1;
      }
    }

    // Calculate the distance travelled for this time step
    GVITotal += Math.sqrt(Math.pow(timeDelta / (1000 * 60), 2) + Math.pow(delta, 2));

    // Keep track of the number of minutes in this timestep
    GVIIdeal_Time += timeDelta / (1000 * 60);
    glucoseTotal += entry.bgValue;

    if (entry.bgValue < options.targetLow) {
      RMSTotal += Math.pow(options.targetLow - entry.bgValue, 2);
    }
    if (entry.bgValue > options.targetHigh) {
      RMSTotal += Math.pow(entry.bgValue - options.targetHigh, 2);
    }
  }

  // Difference between first and last reading
  var GVIDelta = Math.floor(glucose_data[0].bgValue - glucose_data[glucose_data.length - 1].bgValue);

  // Delta for total time considered against total period rise
  GVIIdeal = Math.sqrt(Math.pow(GVIIdeal_Time, 2) + Math.pow(GVIDelta, 2));

  var GVI = Math.round(GVITotal / GVIIdeal * 100) / 100;
  // console.log('GVI', GVI, 'GVIIdeal', GVIIdeal, 'GVITotal', GVITotal, 'GVIIdeal_Time', GVIIdeal_Time);

  var glucoseMean = Math.floor(glucoseTotal / usedRecords);
  var tirMultiplier = result.Normal.readingspct / 100.0;
  var PGS = Math.round(GVI * glucoseMean * (1 - tirMultiplier) * 100) / 100;
  // console.log('glucoseMean', glucoseMean, 'tirMultiplier', tirMultiplier, 'PGS', PGS);

  var TDC = deltaTotal / daysTotal;
  var TDCHourly = TDC / 24.0;

  var RMS = Math.sqrt(RMSTotal / events);

  //  console.log('TADC',TDC,'days',days);

  var timeInT1 = Math.round(100 * t1count / events).toFixed(1);
  var timeInT2 = Math.round(100 * t2count / events).toFixed(1);

  var unitString = ' mg/dl';
  
  if (displayUnits == 'mmol') {
    TDC = TDC / consts.MMOL_TO_MGDL;
    TDCHourly = TDCHourly / consts.MMOL_TO_MGDL;
    unitString = ' mmol/L';

    RMS = Math.sqrt(RMSTotal / events) / consts.MMOL_TO_MGDL;
  }

  TDC = Math.round(TDC * 100) / 100;
  TDCHourly = Math.round(TDCHourly * 100) / 100;

  // var stabilitytable = $('<table style="width: 100%;">');

  // var t1exp = '>5 mg/dl/5m';
  // var t2exp = '>10 mg/dl/5m';
  // if (displayUnits == 'mmol') {
  //   t1exp = '>0.27 mmol/l/5m';
  //   t2exp = '>0.55 mmol/l/5m';
  // }

  // $('<tr><th>' + translate('Mean Total Daily Change') + '</th><th>' + translate('Time in fluctuation') + '<br>(' + t1exp + ')</th><th>' + translate('Time in rapid fluctuation') + '<br>(' + t2exp + ')</th></tr>').appendTo(stabilitytable);
  // $('<tr><td class="tdborder">' + TDC + unitString + '</td><td class="tdborder">' + timeInT1 + '%</td><td class="tdborder">' + timeInT2 + '%</td></tr>').appendTo(stabilitytable);

  // $('<tr><th>' + translate('Mean Hourly Change') + '</th><th>GVI</th><th>PGS</th></tr>').appendTo(stabilitytable);
  // $('<tr><td class="tdborder">' + TDCHourly + unitString + '</td><td class="tdborder">' + GVI + '</td><td class="tdborder">' + PGS + '</td></tr>').appendTo(stabilitytable);

  // $('<tr><th>Out of Range RMS</th></tr>').appendTo(stabilitytable);
  // $('<tr><td class="tdborder">' + Math.round(RMS * 100) / 100 + unitString + '</td></tr>').appendTo(stabilitytable);
  // stabilitytable.appendTo(stability);

  // setTimeout(function() {
  //   $.plot(
  //     '#glucosedistribution-overviewchart'
  //     , stats, {
  //       series: {
  //         pie: {
  //           show: true
  //         }
  //       }
  //       , colors: colors
  //     }
  //   );
  // });


  // console.log('GVI', GVI, 'GVIIdeal', GVIIdeal, 'GVITotal', GVITotal, 'GVIIdeal_Time', GVIIdeal_Time);
  // var glucoseMean = Math.floor(glucoseTotal / usedRecords);
  // var tirMultiplier = result.Normal.readingspct / 100.0;
  // var PGS = Math.round(GVI * glucoseMean * (1 - tirMultiplier) * 100) / 100;
  // console.log('glucoseMean', glucoseMean, 'tirMultiplier', tirMultiplier, 'PGS', PGS);

  const hba1c = (Math.round(10 * (ss.mean(mgDlBgs) + 46.7) / 28.7) / 10).toFixed(1)
  return {
      PGS,
      GVI,
      result,
      hba1c
  }
}