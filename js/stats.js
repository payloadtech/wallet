'use strict';

var URL = 'https://bws.bitpay.com/bws/api';
// var URL = 'http://localhost:3232/bws/api';
var FROM = '2015-01-01';


function Stats() {

};

Stats.prototype.run = function() {
  var self = this;

  $('#network').change(function() {
    self.refresh();
  }).trigger('change');
};

Stats.prototype.refresh = function() {
  var self = this;

  var network = $('#network').val();
  this.fetch(network, function(err, data) {
    if (err) {
      self.error('Could not fetch data');
      return;
    }
    self.show(data);
  });
};

Stats.prototype.fetch = function(network, cb) {
  var self = this;

  var from = FROM;
  var to = moment().subtract(1, 'days').format('YYYY-MM-DD');
  var url = URL + '/v1/stats/?network=' + network + '&from=' + from + '&to=' + to;

  d3.json(url)
    .get(function(err, data) {
      if (err) return cb(err);
      if (!data || _.isEmpty(data)) return cb('No data');

      var data = self.transform(data);
      return cb(null, data);
    });
};

Stats.prototype.transform = function(data) {
  var parseDate = d3.time.format('%Y%m%d').parse;

  var result = {};
  _.each(data.newWallets.byDay, function(d) {
    if (!result[d.day]) result[d.day] = {};
    result[d.day].walletCount = d.count;
  });
  _.each(data.txProposals.amountByDay, function(d) {
    if (!result[d.day]) result[d.day] = {};
    result[d.day].txAmount = d.amount / 1e8;
  });
  _.each(data.txProposals.nbByDay, function(d) {
    if (!result[d.day]) result[d.day] = {};
    result[d.day].txCount = d.count;
  });

  return _.map(result, function(v, k) {
    return {
      date: parseDate(k),
      amount: v.txAmount,
      txps: v.txCount,
      wallets: v.walletCount,
    };
  });
};

Stats.prototype.error = function(msg) {
  alert(msg);
};

Stats.prototype.show = function(data) {
  this.showTotals(data);
  this.showWallets(data);
  this.showTransactions(data);
  this.showAmount(data);
};

Stats.prototype.showTotals = function(data) {
  function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  };

  var total = _.reduce(data, function(memo, d) {
    memo.wallets += (d.wallets || 0);
    memo.txps += (d.txps || 0);
    memo.amount += (d.amount || 0);
    return memo;
  }, {
    wallets: 0,
    txps: 0,
    amount: 0
  });

  $('#total-wallets .value').html(addCommas(total.wallets));
  $('#total-txps .value').html(addCommas(total.txps));
  $('#total-amount .value').html(addCommas(total.amount.toFixed(2)));
};

Stats.prototype.showWallets = function(data) {
  data = [{
    key: 'New wallets',
    values: _.map(data, function(d) {
      return {
        x: d.date,
        y: d.wallets || 0,
      };
    }),
  }];

  nv.addGraph(function() {
    var chart = nv.models.lineChart()
      .useInteractiveGuideline(true);

    chart.xAxis
      .tickFormat(function(d) {
        return d3.time.format('%b %d')(new Date(d));
      });

    chart.yAxis
      .axisLabel(data[0].key)
      .tickFormat(d3.format(',f'));

    d3.select('#chart-wallets svg').remove();
    d3.select('#chart-wallets')
      .append('svg')
      .datum(data)
      .transition().duration(500)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
};

Stats.prototype.showTransactions = function(data) {
  data = [{
    key: '# of Transaction proposals',
    values: _.map(data, function(d) {
      return {
        x: d.date,
        y: d.txps || 0,
      };
    }),
  }];

  nv.addGraph(function() {
    var chart = nv.models.lineChart()
      .useInteractiveGuideline(true);

    chart.xAxis
      .tickFormat(function(d) {
        return d3.time.format('%b %d')(new Date(d));
      });

    chart.yAxis
      .axisLabel(data[0].key)
      .tickFormat(d3.format(',f'));

    d3.select('#chart-txps svg').remove();
    d3.select('#chart-txps')
      .append('svg')
      .datum(data)
      .transition().duration(500)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
};

Stats.prototype.showAmount = function(data) {
  data = [{
    key: 'Amount sent (BTC)',
    values: _.map(data, function(d) {
      return {
        x: d.date,
        y: d.amount || 0,
      };
    }),
  }];

  nv.addGraph(function() {
    var chart = nv.models.lineChart()
      .useInteractiveGuideline(true);

    chart.xAxis
      .tickFormat(function(d) {
        return d3.time.format('%b %d')(new Date(d));
      });

    chart.yAxis
      .axisLabel(data[0].key)
      .tickFormat(d3.format('.02f'));

    d3.select('#chart-amount svg').remove();
    d3.select('#chart-amount')
      .append('svg')
      .datum(data)
      .transition().duration(500)
      .call(chart);

    nv.utils.windowResize(chart.update);

    return chart;
  });
};