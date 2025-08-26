import React, { useState, useEffect } from 'react'
import { X, User, LogOut, FileText, Calendar, Trash2, UserPlus, Download } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Report {
  id: string
  title: string
  content: string
  pdf_data: string
  sentiment_data: any
  topic: string
  posts_analyzed: number
  created_at: string
}

interface ProfileSidebarProps {
  isOpen: boolean
  onClose: () => void
  onSignupClick?: () => void
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ isOpen, onClose, onSignupClick }) => {
  const { user, signOut, isGuest, getDisplayName } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && user) {
      fetchReports()
    }
  }, [isOpen, user])

  const fetchReports = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      console.log('Fetching reports for user:', user.id)
      
      const { data, error } = await supabase
        .from('sentiment_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase fetch error:', error)
        toast.error(`Failed to fetch reports: ${error.message}`)
      } else {
        console.log('Fetched reports:', data)
        setReports(data || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('An error occurred while fetching reports')
    } finally {
      setLoading(false)
    }
  }

  const deleteReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('sentiment_reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user?.id)

      if (error) {
        toast.error('Failed to delete report')
      } else {
        toast.success('Report deleted successfully')
        setReports(reports.filter(report => report.id !== reportId))
      }
    } catch (error) {
      toast.error('An error occurred while deleting the report')
    }
  }

  const downloadReport = async (report: Report) => {
    try {
      if (!report.pdf_data) {
        toast.error('PDF data not available for this report')
        return
      }

      // Convert base64 to blob and download
      const byteCharacters = atob(report.pdf_data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.topic || 'SentimentReport'}_${new Date(report.created_at).toLocaleDateString()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Report downloaded successfully')
    } catch (error) {
      console.error('Error downloading report:', error)
      toast.error('Failed to download report')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-medium">{getDisplayName()}</p>
              <p className="text-gray-400 text-sm">
                {isGuest ? 'Guest User' : `Joined ${user?.created_at ? formatDate(user.created_at) : 'Recently'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Reports Section */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Your Reports
            </h3>
            <span className="text-sm text-gray-400">
              {reports.length} report{reports.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isGuest ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-white mb-2">You are currently logged in as guest.</p>
              <p className="text-sm">Signup to save your work.</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No reports yet</p>
              <p className="text-sm">Generate your first sentiment analysis!</p>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium text-sm truncate flex-1">
                        {report.topic || report.title}
                      </h4>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => downloadReport(report)}
                          className="text-gray-400 hover:text-green-400 transition-colors p-1"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteReport(report.id)}
                          className="text-gray-400 hover:text-red-400 transition-colors p-1"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                      {report.content.substring(0, 100)}...
                    </p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(report.created_at)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {report.posts_analyzed || 0} posts
                        </span>
                        {report.sentiment_data?.overall_sentiment && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.sentiment_data.overall_sentiment === 'positive' 
                              ? 'bg-green-900 text-green-300'
                              : report.sentiment_data.overall_sentiment === 'negative'
                              ? 'bg-red-900 text-red-300'
                              : 'bg-yellow-900 text-yellow-300'
                          }`}>
                            {report.sentiment_data.overall_sentiment}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          {isGuest ? (
            <Button
              onClick={() => {
                onClose()
                onSignupClick?.()
              }}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Sign Up
            </Button>
          ) : (
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
