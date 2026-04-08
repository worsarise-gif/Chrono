import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Users, MessageSquare, Zap } from 'lucide-react';

const generateMockData = (days: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      users: Math.floor(Math.random() * 500) + 100,
      messages: Math.floor(Math.random() * 5000) + 1000,
    });
  }
  return data;
};

const modelUsageData = [
  { name: 'Gemini 2.5 Flash', usage: 45000, limit: 50000 },
  { name: 'Gemini 2.5 Pro', usage: 12000, limit: 20000 },
  { name: 'Llama 3.1 8B', usage: 35000, limit: 100000 },
  { name: 'Llama 3.3 70B', usage: 8000, limit: 15000 },
  { name: 'SDXL Base', usage: 2500, limit: 5000 },
];

export default function OverviewTab() {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);
  const chartData = useMemo(() => generateMockData(timeRange), [timeRange]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground text-sm">Real-time analytics and system metrics.</p>
        </div>
        <div className="flex bg-surface border border-border rounded-lg p-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as any)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${timeRange === days ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Active Users', value: '12,493', change: '+14%', icon: Users, color: 'text-blue-500' },
          { title: 'Messages Sent', value: '1.2M', change: '+22%', icon: MessageSquare, color: 'text-green-500' },
          { title: 'Avg Response Time', value: '840ms', change: '-5%', icon: Zap, color: 'text-yellow-500' },
          { title: 'System Health', value: '99.9%', change: 'Stable', icon: Activity, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-background border border-border ${stat.color}`}>
                <stat.icon size={18} />
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-4">
              <span className={stat.change.startsWith('+') ? 'text-green-500' : stat.change.startsWith('-') ? 'text-blue-500' : 'text-emerald-500'}>
                {stat.change}
              </span> from last period
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-6">User Activity & Message Volume</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)' }}
                  itemStyle={{ color: 'var(--color-foreground)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area yAxisId="left" type="monotone" dataKey="users" name="Active Users" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                <Area yAxisId="right" type="monotone" dataKey="messages" name="Messages" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMessages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-6">AI Model Usage Breakdown</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelUsageData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-border)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '8px', color: 'var(--color-foreground)' }}
                />
                <Bar dataKey="usage" name="Tokens/Reqs" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}