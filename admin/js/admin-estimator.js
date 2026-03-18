/* ============================================================
   B&B Admin — Estimator Settings Panel
   ============================================================ */

window.BB = window.BB || {};
window.BB.Panels = window.BB.Panels || {};

BB.Panels.initEstimator = function () {
  var settings = BB.Store.getEstimatorSettings() || BB.Store.read('bb_estimator_settings', null);
  if (!settings) {
    // Load defaults from data-layer
    settings = getDefaults();
  }
  populateEstimatorForm(settings);
  wireAccordions();
};

function getDefaults() {
  return {
    sqftMap: { small: 100, medium: 150, large: 220, xlarge: 300 },
    scopeRates: {
      refresh: { kitchen: { low: 75, high: 125 }, bathroom: { low: 100, high: 150 } },
      standard: { kitchen: { low: 150, high: 250 }, bathroom: { low: 200, high: 350 } },
      gut: { kitchen: { low: 300, high: 500 }, bathroom: { low: 400, high: 650 } }
    },
    structCosts: {
      walls: [5000, 15000], windows: [3000, 10000], plumbing: [2000, 8000],
      electrical: [1500, 5000], hvac: [3000, 10000], structural: [4000, 12000]
    },
    cabinetMultipliers: { stock: 1, 'semi-custom': 1.15, custom: 1.35 },
    counterMultipliers: { marble: 1.5, quartzite: 1.6, quartz: 1.2, granite: 1.1, butcherblock: 1 },
    applianceCosts: {
      builder: [3000, 6000], 'mid-range': [8000, 15000], premium: [15000, 30000], ultra: [30000, 60000]
    },
    bathroomAdders: { steam: [8000, 15000], freestanding: [2000, 8000], jetted: [3000, 10000] },
    globalDiscount: 0.9,
    minimumLow: 15000
  };
}

function populateEstimatorForm(s) {
  var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val; };

  // Sqft map
  set('est-sqft-small', s.sqftMap.small);
  set('est-sqft-medium', s.sqftMap.medium);
  set('est-sqft-large', s.sqftMap.large);
  set('est-sqft-xlarge', s.sqftMap.xlarge);

  // Scope rates - kitchen
  set('est-refresh-k-low', s.scopeRates.refresh.kitchen.low);
  set('est-refresh-k-high', s.scopeRates.refresh.kitchen.high);
  set('est-standard-k-low', s.scopeRates.standard.kitchen.low);
  set('est-standard-k-high', s.scopeRates.standard.kitchen.high);
  set('est-gut-k-low', s.scopeRates.gut.kitchen.low);
  set('est-gut-k-high', s.scopeRates.gut.kitchen.high);

  // Scope rates - bathroom
  set('est-refresh-b-low', s.scopeRates.refresh.bathroom.low);
  set('est-refresh-b-high', s.scopeRates.refresh.bathroom.high);
  set('est-standard-b-low', s.scopeRates.standard.bathroom.low);
  set('est-standard-b-high', s.scopeRates.standard.bathroom.high);
  set('est-gut-b-low', s.scopeRates.gut.bathroom.low);
  set('est-gut-b-high', s.scopeRates.gut.bathroom.high);

  // Structural adders
  set('est-struct-walls-lo', s.structCosts.walls[0]);
  set('est-struct-walls-hi', s.structCosts.walls[1]);
  set('est-struct-plumbing-lo', s.structCosts.plumbing[0]);
  set('est-struct-plumbing-hi', s.structCosts.plumbing[1]);
  set('est-struct-electrical-lo', s.structCosts.electrical[0]);
  set('est-struct-electrical-hi', s.structCosts.electrical[1]);
  set('est-struct-hvac-lo', s.structCosts.hvac[0]);
  set('est-struct-hvac-hi', s.structCosts.hvac[1]);
  set('est-struct-structural-lo', s.structCosts.structural[0]);
  set('est-struct-structural-hi', s.structCosts.structural[1]);

  // Cabinet multipliers
  set('est-cab-stock', s.cabinetMultipliers.stock);
  set('est-cab-semi', s.cabinetMultipliers['semi-custom']);
  set('est-cab-custom', s.cabinetMultipliers.custom);

  // Counter multipliers
  set('est-ctr-marble', s.counterMultipliers.marble);
  set('est-ctr-quartzite', s.counterMultipliers.quartzite);
  set('est-ctr-quartz', s.counterMultipliers.quartz);
  set('est-ctr-granite', s.counterMultipliers.granite);
  set('est-ctr-butcher', s.counterMultipliers.butcherblock);

  // Appliance costs
  set('est-app-builder-lo', s.applianceCosts.builder[0]);
  set('est-app-builder-hi', s.applianceCosts.builder[1]);
  set('est-app-midrange-lo', s.applianceCosts['mid-range'][0]);
  set('est-app-midrange-hi', s.applianceCosts['mid-range'][1]);
  set('est-app-premium-lo', s.applianceCosts.premium[0]);
  set('est-app-premium-hi', s.applianceCosts.premium[1]);
  set('est-app-ultra-lo', s.applianceCosts.ultra[0]);
  set('est-app-ultra-hi', s.applianceCosts.ultra[1]);

  // Bath adders
  set('est-bath-steam-lo', s.bathroomAdders.steam[0]);
  set('est-bath-steam-hi', s.bathroomAdders.steam[1]);
  set('est-bath-freestanding-lo', s.bathroomAdders.freestanding[0]);
  set('est-bath-freestanding-hi', s.bathroomAdders.freestanding[1]);
  set('est-bath-jetted-lo', s.bathroomAdders.jetted[0]);
  set('est-bath-jetted-hi', s.bathroomAdders.jetted[1]);

  // Global
  set('est-global-discount', ((1 - s.globalDiscount) * 100).toFixed(0));
  set('est-global-minimum', s.minimumLow);
}

function readEstimatorForm() {
  var g = function (id) { var el = document.getElementById(id); return el ? parseFloat(el.value) || 0 : 0; };
  return {
    sqftMap: { small: g('est-sqft-small'), medium: g('est-sqft-medium'), large: g('est-sqft-large'), xlarge: g('est-sqft-xlarge') },
    scopeRates: {
      refresh: { kitchen: { low: g('est-refresh-k-low'), high: g('est-refresh-k-high') }, bathroom: { low: g('est-refresh-b-low'), high: g('est-refresh-b-high') } },
      standard: { kitchen: { low: g('est-standard-k-low'), high: g('est-standard-k-high') }, bathroom: { low: g('est-standard-b-low'), high: g('est-standard-b-high') } },
      gut: { kitchen: { low: g('est-gut-k-low'), high: g('est-gut-k-high') }, bathroom: { low: g('est-gut-b-low'), high: g('est-gut-b-high') } }
    },
    structCosts: {
      walls: [g('est-struct-walls-lo'), g('est-struct-walls-hi')],
      plumbing: [g('est-struct-plumbing-lo'), g('est-struct-plumbing-hi')],
      electrical: [g('est-struct-electrical-lo'), g('est-struct-electrical-hi')],
      hvac: [g('est-struct-hvac-lo'), g('est-struct-hvac-hi')],
      structural: [g('est-struct-structural-lo'), g('est-struct-structural-hi')]
    },
    cabinetMultipliers: { stock: g('est-cab-stock'), 'semi-custom': g('est-cab-semi'), custom: g('est-cab-custom') },
    counterMultipliers: { marble: g('est-ctr-marble'), quartzite: g('est-ctr-quartzite'), quartz: g('est-ctr-quartz'), granite: g('est-ctr-granite'), butcherblock: g('est-ctr-butcher') },
    applianceCosts: {
      builder: [g('est-app-builder-lo'), g('est-app-builder-hi')],
      'mid-range': [g('est-app-midrange-lo'), g('est-app-midrange-hi')],
      premium: [g('est-app-premium-lo'), g('est-app-premium-hi')],
      ultra: [g('est-app-ultra-lo'), g('est-app-ultra-hi')]
    },
    bathroomAdders: {
      steam: [g('est-bath-steam-lo'), g('est-bath-steam-hi')],
      freestanding: [g('est-bath-freestanding-lo'), g('est-bath-freestanding-hi')],
      jetted: [g('est-bath-jetted-lo'), g('est-bath-jetted-hi')]
    },
    globalDiscount: 1 - (g('est-global-discount') / 100),
    minimumLow: g('est-global-minimum')
  };
}

function wireAccordions() {
  document.querySelectorAll('.acc-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var section = header.closest('.acc-section');
      section.classList.toggle('open');
    });
  });
}

BB.EstimatorAdmin = {
  save: function () {
    var settings = readEstimatorForm();
    BB.Store.saveEstimatorSettings(settings);
    BB.toast('Estimator settings saved');
  },
  reset: function () {
    if (!confirm('Reset all estimator settings to factory defaults?')) return;
    var defaults = getDefaults();
    BB.Store.saveEstimatorSettings(defaults);
    populateEstimatorForm(defaults);
    BB.toast('Settings reset to defaults');
  }
};
