/**
 * B&B Associates — Supabase Client
 * Initializes the Supabase client and exposes BB.Supabase.insertLead()
 * for all form handlers to use.
 */
(function () {
  var SUPABASE_URL = 'https://uiwubmhfrepmclvdisff.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpd3VibWhmcmVwbWNsdmRpc2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Njg4NjYsImV4cCI6MjA4OTQ0NDg2Nn0.KRluwn9Om8QNlRl9Ksmrz3I8sT5XRobfOo7aeMN22BM';

  window.BB = window.BB || {};

  // Wait for supabase CDN to load
  function getClient() {
    if (window._bbSupabaseClient) return window._bbSupabaseClient;
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      window._bbSupabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return window._bbSupabaseClient;
    }
    return null;
  }

  BB.Supabase = {
    /**
     * Insert a lead into the Supabase `leads` table.
     * Maps camelCase JS fields to snake_case DB columns.
     * Silently fails — localStorage is always the primary fallback.
     */
    insertLead: function (lead) {
      try {
        var client = getClient();
        if (!client) return;
        var row = {
          id:           lead.id,
          date:         lead.date,
          status:       lead.status       || 'new',
          type:         lead.type         || '',
          source:       lead.source       || '',
          first_name:   lead.firstName    || lead.first_name  || '',
          last_name:    lead.lastName     || lead.last_name   || '',
          phone:        lead.phone        || '',
          email:        lead.email        || '',
          project_type: lead.projectType  || lead.project_type || '',
          budget:       lead.budget       || '',
          timeline:     lead.timeline     || '',
          home_value:   lead.homeValue    || lead.home_value  || '',
          town:         lead.town         || '',
          description:  lead.description  || '',
          service_area: lead.service_area || '',
          notes:        lead.notes        || ''
        };
        client.from('leads').insert([row]).then(function (res) {
          if (res.error) console.warn('[BB Supabase] insert error:', res.error.message);
        });
      } catch (e) {
        console.warn('[BB Supabase] insertLead exception:', e);
      }
    },

    /**
     * Fetch all leads from Supabase, ordered newest first.
     * Returns a Promise that resolves with an array of leads.
     */
    fetchLeads: function () {
      return new Promise(function (resolve) {
        try {
          var client = getClient();
          if (!client) { resolve([]); return; }
          client
            .from('leads')
            .select('*')
            .order('date', { ascending: false })
            .then(function (res) {
              if (res.error) { console.warn('[BB Supabase] fetchLeads error:', res.error.message); resolve([]); return; }
              // Normalize snake_case back to camelCase for admin compatibility
              var leads = (res.data || []).map(function (r) {
                return {
                  id:           r.id,
                  date:         r.date || r.created_at,
                  status:       r.status,
                  type:         r.type,
                  source:       r.source,
                  firstName:    r.first_name,
                  lastName:     r.last_name,
                  phone:        r.phone,
                  email:        r.email,
                  projectType:  r.project_type,
                  budget:       r.budget,
                  timeline:     r.timeline,
                  homeValue:    r.home_value,
                  town:         r.town,
                  description:  r.description,
                  service_area: r.service_area,
                  notes:        r.notes
                };
              });
              resolve(leads);
            });
        } catch (e) {
          console.warn('[BB Supabase] fetchLeads exception:', e);
          resolve([]);
        }
      });
    },

    /**
     * Update a lead's status or notes in Supabase.
     */
    updateLead: function (id, patch) {
      try {
        var client = getClient();
        if (!client) return;
        var row = {};
        if (patch.status !== undefined)      row.status      = patch.status;
        if (patch.notes  !== undefined)      row.notes       = patch.notes;
        if (patch.firstName !== undefined)   row.first_name  = patch.firstName;
        if (patch.lastName  !== undefined)   row.last_name   = patch.lastName;
        client.from('leads').update(row).eq('id', id).then(function (res) {
          if (res.error) console.warn('[BB Supabase] updateLead error:', res.error.message);
        });
      } catch (e) {}
    },

    /**
     * Delete a lead from Supabase.
     */
    deleteLead: function (id) {
      try {
        var client = getClient();
        if (!client) return;
        client.from('leads').delete().eq('id', id).then(function (res) {
          if (res.error) console.warn('[BB Supabase] deleteLead error:', res.error.message);
        });
      } catch (e) {}
    },

    /**
     * Fetch analytics events, newest first. Optionally limit to events
     * on/after an ISO timestamp. Resolves with [] on any failure so the
     * admin panel can fall back to localStorage.
     */
    fetchEvents: function (sinceISO, limit) {
      return new Promise(function (resolve) {
        try {
          var client = getClient();
          if (!client) { resolve([]); return; }
          var q = client.from('analytics_events').select('*')
            .order('created_at', { ascending: false })
            .limit(limit || 10000);
          if (sinceISO) q = q.gte('created_at', sinceISO);
          q.then(function (res) {
            if (res.error) { console.warn('[BB Supabase] fetchEvents error:', res.error.message); resolve([]); return; }
            resolve(res.data || []);
          });
        } catch (e) {
          console.warn('[BB Supabase] fetchEvents exception:', e);
          resolve([]);
        }
      });
    }
  };
})();
