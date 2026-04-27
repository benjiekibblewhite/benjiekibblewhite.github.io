// frontend/supabase-client.js

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Auth helpers
const auth = {
  async signUp(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });
    if (error) throw new Error(`Failed to sign up: ${error.message}`);
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
    if (error) throw new Error(`Failed to sign in: ${error.message}`);
    return data;
  },

  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw new Error(`Failed to sign out: ${error.message}`);
  },

  async getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  },

  onAuthStateChange(callback) {
    return supabaseClient.auth.onAuthStateChange(callback);
  }
};

// Database helpers
const db = {
  async getAllAlbums() {
    const { data, error } = await supabaseClient
      .from('albums')
      .select('*')
      .order('artist', { ascending: true });

    if (error) throw new Error(`Failed to fetch albums: ${error.message}`);
    return data;
  },

  async getMyRatings() {
    const { data, error } = await supabaseClient
      .from('ratings')
      .select(`
        *,
        album:albums(*)
      `)
      .order('rated_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch ratings: ${error.message}`);
    return data;
  },

  async getTodaysPick() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseClient
      .from('daily_picks')
      .select(`
        *,
        album:albums(*)
      `)
      .gte('picked_at', today.toISOString())
      .order('picked_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw new Error(`Failed to fetch today's pick: ${error.message}`); // PGRST116 = no rows
    return data;
  },

  async rateAlbum(albumId, rating, review) {
    if (!albumId || !rating) {
      throw new Error('albumId and rating are required');
    }
    if (rating < 1 || rating > 10) {
      throw new Error('rating must be between 1 and 10');
    }

    const { data, error } = await supabaseClient
      .from('ratings')
      .insert({
        album_id: albumId,
        rating: rating,
        review: review || null
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to rate album: ${error.message}`);
    return data;
  },

  async updateRating(albumId, rating, review) {
    if (!albumId || !rating) {
      throw new Error('albumId and rating are required');
    }
    if (rating < 1 || rating > 10) {
      throw new Error('rating must be between 1 and 10');
    }

    const { data, error } = await supabaseClient
      .from('ratings')
      .update({
        rating: rating,
        review: review || null
      })
      .eq('album_id', albumId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update rating: ${error.message}`);
    return data;
  }
};
