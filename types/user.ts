export interface ApiKey {
    id: string;
    user_id: string;
    label: string;
    encrypted_api_key: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: string;
    email: string;
    user_metadata: {
        name?: string;
        avatar_url?: string;
        full_name?: string;
    };
}
