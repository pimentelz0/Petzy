/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Pet {
  id: string;
  name: string;
  type: string; // "Dog", "Cat", "Capybara", etc. (free-text)
  breed: string;
  birth_date: string; // YYYY-MM-DD
  photo_url?: string;
  user_id: string;
  created_at?: string;
}

export interface Vaccine {
  id: string;
  pet_id: string;
  name: string;
  date: string; // YYYY-MM-DD
  next_dose_date: string; // YYYY-MM-DD
  user_id: string;
  created_at?: string;
}

export interface Appointment {
  id: string;
  pet_id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  veterinarian: string;
  reason: string;
  observations: string;
  user_id: string;
  created_at?: string;
}

export interface Medication {
  id: string;
  pet_id: string;
  name: string;
  dose: string; // e.g., "5ml" or "1 tablet"
  frequency: string; // e.g., "12h" or "daily"
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  user_id: string;
  created_at?: string;
}

export interface WeightRecord {
  id: string;
  pet_id: string;
  date: string; // YYYY-MM-DD
  weight: number; // in kg
  user_id: string;
  created_at?: string;
}

export interface HealthyRecipe {
  id: string;
  pet_type: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  benefits: string;
}

export interface Profile {
  id: string;
  email: string;
  name?: string;
}
