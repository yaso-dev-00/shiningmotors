
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Smartphone, Monitor, Tablet, Users, TrendingUp, MapPin, Star } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useIsMobile } from '@/hooks/useIsMobile';

interface EventRegistrationAnalyticsProps {
  eventAnalytics: any;
  formatCurrency: (amount: number) => string;
}

const EventRegistrationAnalytics: React.FC<EventRegistrationAnalyticsProps> = ({ 
  eventAnalytics, 
  formatCurrency 
}) => {
  const isMobile=useIsMobile()
  if (!eventAnalytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
   
  const deviceIconMap = {
    mobile: <Smartphone className="w-5 h-5" />,
    tablet: <Tablet className="w-5 h-5" />,
    desktop: <Monitor className="w-5 h-5" />
  };

  // Safe access to device usage data
  const deviceUsage = eventAnalytics.deviceUsage || {
    deviceTypes: [
      { name: 'Mobile', value: 0 },
      { name: 'Desktop', value: 0 },
      { name: 'Tablet', value: 0 }
    ],
    platforms: []
  };
 
  return (
    <div className="space-y-3 md:space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-blue-600">{eventAnalytics.totalRegistrations}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(eventAnalytics.totalRevenue)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-purple-600">{eventAnalytics.conversionMetrics?.averageConversionRate || 0}%</p>
              </div>
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-orange-600">{eventAnalytics.feedbackMetrics?.averageRating?.toFixed(1) || 'N/A'}</p>
              </div>
              <Star className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registration Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Registration Trends (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width={isMobile?"120%":"100%"} height={300} className="relative right-12">
            <LineChart data={eventAnalytics.registrationTrends || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="registrations" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Device Usage Analytics */}
     {deviceUsage && Object.keys(deviceUsage).length && <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        { (deviceUsage?.deviceTypes && Object.keys(deviceUsage?.deviceTypes)?.length) ? <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceUsage.deviceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                   label={(props: any) => {
                     const { name, percent, x, y } = props;
                     return (
                       <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className='text-[13px] md:text-[15px]' fontSize={10}>
                         {`${name}: ${(percent * 100).toFixed(0)}%`}
                       </text>
                     );
                   }}
                  outerRadius={isMobile?70:80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceUsage.deviceTypes.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>:<></>}

     { (deviceUsage?.platforms && deviceUsage?.platforms?.length) ? <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deviceUsage.platforms.map((platform: any, index: number) => (
                <div key={platform.name} className="flex items-center justify-between p-2 border rounded">
                  <span className="font-medium">{platform.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{platform.count} users</span>
                    <span className="text-sm font-bold">{platform.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>:<></>}
      </div>}

      {/* Registration Sources & Demographic Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registration Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width={isMobile?"120%":"100%"} height={250} className="relative right-12">
              <BarChart data={eventAnalytics.registrationSources || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="source" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Age Group Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width={isMobile?"120%":"100%"} height={250} className="relative right-12">
              <BarChart data={eventAnalytics.demographicInsights?.ageGroups || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
 <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {eventAnalytics.demographicInsights?.topLocations?.map((location: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        <span>{location.city}</span>
                      </div>
                      <Badge variant="outline">{location.count}</Badge>
                    </div>
                  )) || <div className="text-gray-500">No location data available</div>}
                </div>
              </CardContent>
            </Card>
      {/* Peak Registration Days */}
     { (eventAnalytics?.peakRegistrationDays && eventAnalytics?.peakRegistrationDays?.length)?<Card>
        <CardHeader>
          <CardTitle>Peak Registration Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventAnalytics.peakRegistrationDays?.slice(0, 6).map((day: any, index: number) => (
              <div key={day.date} className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600">{day.dayOfWeek}</div>
                <div className="text-lg font-bold">{new Date(day.date).toLocaleDateString()}</div>
                <div className="text-sm text-blue-600">{day.registrations} registrations</div>
                <div className="text-sm text-green-600">{formatCurrency(day.revenue)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>:<></>}

      {/* Attendance & Feedback Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Attendance Rate</span>
                <span className="font-bold text-green-600">{eventAnalytics.attendanceMetrics?.attendanceRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Drop-off Rate</span>
                <span className="font-bold text-orange-600">{eventAnalytics.attendanceMetrics?.dropOffRate || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>No-show Rate</span>
                <span className="font-bold text-red-600">{eventAnalytics.attendanceMetrics?.noShowRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

     { (eventAnalytics?.recentFeedback && eventAnalytics?.recentFeedback.length) ? <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventAnalytics.recentFeedback?.slice(0, 3).map((feedback: any, index: number) => (
                <div key={index} className="p-3 border rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{feedback.participantName}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{feedback.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">{feedback.eventTitle}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>:<></>}
      </div>

      {/* Key Insights & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventAnalytics.keyInsights?.map((insight: any, index: number) => (
                <div key={index} className="p-3 bg-blue-50 rounded">
                  <h4 className="font-medium text-blue-800">{insight.title}</h4>
                  <p className="text-sm text-blue-600">{insight.description}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    insight.impact === 'High' ? 'bg-red-100 text-red-800' :
                    insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.impact} Impact
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventAnalytics.recommendations?.map((rec: any, index: number) => (
                <div key={index} className="p-3 bg-green-50 rounded">
                  <h4 className="font-medium text-green-800">{rec.title}</h4>
                  <p className="text-sm text-green-600">{rec.description}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventRegistrationAnalytics;
