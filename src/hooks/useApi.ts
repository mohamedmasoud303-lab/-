import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from 'lib/supabase';
import { Property, Contract, Invoice, Receipt } from 'core/types';

// Helper for snake_case conversion
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function transformKeys(obj: any, transformer: (s: string) => string): any {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(v => transformKeys(v, transformer));
  const newObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    newObj[transformer(key)] = transformKeys(value, transformer);
  }
  return newObj;
}

// Example: Fetching paginated properties
export const useProperties = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['properties', page, limit],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as Property[], count };
    },
  });
};

// Example: Fetching a single contract
export const useContract = (id: string) => {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Contract;
    },
    enabled: !!id,
  });
};

// Example: Fetching invoices with filters
export const useInvoices = (status?: string) => {
  return useQuery({
    queryKey: ['invoices', status],
    queryFn: async () => {
      let query = supabase.from('invoices').select('*');
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query.order('due_date', { ascending: true });

      if (error) throw error;
      return data as Invoice[];
    },
  });
};

// Example: Mutation for adding a property
export const useAddProperty = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newProperty: Partial<Property>) => {
      const snakeProperty = transformKeys(newProperty, toSnakeCase);
      const { data, error } = await supabase
        .from('properties')
        .insert(snakeProperty)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};
