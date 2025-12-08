// Admin server actions using service role key
// These actions should only be callable from server components or API routes

'use server'

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'
import { redirect } from 'next/navigation'

// Create a service role client for admin operations
const createAdminClient = () => {
  // This uses the service_role key which bypasses RLS
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Ban a user by ID
 */
export async function banUser(userId: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: true })
    .eq('id', userId)
  
  if (error) {
    console.error('Error banning user:', error)
    throw new Error('Failed to ban user')
  }
  
  return { success: true }
}

/**
 * Unban a user by ID
 */
export async function unbanUser(userId: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: false })
    .eq('id', userId)
  
  if (error) {
    console.error('Error unbanning user:', error)
    throw new Error('Failed to unban user')
  }
  
  return { success: true }
}

/**
 * Ban a business by ID
 */
export async function banBusiness(businessId: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('businesses')
    .update({ is_banned: true })
    .eq('id', businessId)
  
  if (error) {
    console.error('Error banning business:', error)
    throw new Error('Failed to ban business')
  }
  
  return { success: true }
}

/**
 * Unban a business by ID
 */
export async function unbanBusiness(businessId: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('businesses')
    .update({ is_banned: false })
    .eq('id', businessId)
  
  if (error) {
    console.error('Error unbanning business:', error)
    throw new Error('Failed to unban business')
  }
  
  return { success: true }
}

/**
 * Approve a business document by ID
 */
export async function approveBusinessDocument(documentId: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('business_documents')
    .update({ status: 'approved' })
    .eq('id', documentId)
  
  if (error) {
    console.error('Error approving document:', error)
    throw new Error('Failed to approve document')
  }
  
  return { success: true }
}

/**
 * Reject a business document by ID
 */
export async function rejectBusinessDocument(documentId: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('business_documents')
    .update({ status: 'rejected' })
    .eq('id', documentId)
  
  if (error) {
    console.error('Error rejecting document:', error)
    throw new Error('Failed to reject document')
  }
  
  return { success: true }
}

/**
 * Delete a business document by ID
 */
export async function deleteBusinessDocument(documentId: string) {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('business_documents')
    .delete()
    .eq('id', documentId)
  
  if (error) {
    console.error('Error deleting document:', error)
    throw new Error('Failed to delete document')
  }
  
  return { success: true }
}