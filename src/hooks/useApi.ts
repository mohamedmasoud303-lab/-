import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Property, Contract, Invoice, Receipt } from '../types';

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
        .order('createdAt', { ascending: false });

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
      const { data, error } = await query.order('dueDate', { ascending: true });

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
      const { data, error } = await supabase
        .from('properties')
        .insert(newProperty)
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
