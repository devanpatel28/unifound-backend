export interface User {
  id: string;
  university_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  profile_image_url?: string;
}

export interface Item {
  id: string;
  user_id: string;
  category_id: string;
  item_type: 'lost' | 'found';
  item_name: string;
  description?: string;
  location: string;
  date_lost_found: string;
  images: ImageData[];
  is_claimed: boolean;
  is_active: boolean;
}

export interface updateData{
    first_name?: string;
    last_name?: string;
    phone?: string;
    profile_image_url?: string;
}

export interface ImageData {
  file_id: string;
  url: string;
  thumbnail_url: string;
}

export interface Category {
  id: string;
  name: string;
  icon_name: string;
}

export interface adminUser {
  id:string;
  full_name:string;
  username:string;
  email:string;
  is_active:boolean;
}