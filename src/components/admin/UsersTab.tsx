import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, MoreVertical, Shield, ShieldOff, Ban, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrorHandler';

const UserRow = ({ user, handleToggleAdmin, handleToggleBan, actionMenuOpen, setActionMenuOpen }: any) => {
  const [chatCount, setChatCount] = useState<number | null>(null);

  useEffect(() => {
    const chatsRef = collection(db, 'users', user.id, 'chats');
    const unsubscribe = onSnapshot(chatsRef, (snapshot) => {
      setChatCount(snapshot.size);
    }, (error) => {
      console.error("Error fetching chats for user", user.id, error);
      setChatCount(0);
    });
    return () => unsubscribe();
  }, [user.id]);

  return (
    <tr className={`hover:bg-background/50 transition-colors ${user.isBanned ? 'opacity-60 bg-red-500/5' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full object-cover border border-border" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-foreground/10 flex items-center justify-center text-foreground font-medium border border-border">
              {user.email?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div>
            <div className="font-medium text-foreground flex items-center gap-2">
              {user.displayName || 'Unknown User'}
              {user.isBanned && <span className="text-[10px] uppercase tracking-wider bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold">Banned</span>}
            </div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
            <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{user.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-surface border border-border text-muted-foreground'}`}>
          {user.role === 'admin' ? 'Admin' : 'User'}
        </span>
      </td>
      <td className="px-6 py-4 text-foreground font-medium">
        {chatCount !== null ? chatCount : <Loader2 className="animate-spin w-4 h-4 text-muted-foreground" />}
      </td>
      <td className="px-6 py-4 text-foreground font-medium">
        {user.totalMessages !== undefined ? user.totalMessages : 0}
      </td>
      <td className="px-6 py-4 text-muted-foreground">
        {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
      </td>
      <td className="px-6 py-4 text-right relative">
        <button 
          onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
          className="p-2 hover:bg-border rounded-md text-muted-foreground transition-colors"
        >
          <MoreVertical size={16} />
        </button>
        
        {actionMenuOpen === user.id && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(null)}></div>
            <div className="absolute right-8 top-10 w-48 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => handleToggleAdmin(user.id, user.role)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-background flex items-center gap-2 text-foreground transition-colors"
              >
                {user.role === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}
                {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
              </button>
              <button 
                onClick={() => handleToggleBan(user.id, user.isBanned)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-background flex items-center gap-2 transition-colors ${user.isBanned ? 'text-green-500' : 'text-red-500'}`}
              >
                {user.isBanned ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                {user.isBanned ? 'Unban User' : 'Ban User'}
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
};

export default function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isBanned: doc.data().isBanned || false,
      }));
      setUsers(usersData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.includes(searchTerm)
  );

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { 
        isBanned: !currentStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(currentStatus ? 'User unbanned successfully' : 'User banned successfully');
      setActionMenuOpen(null);
    } catch (error) {
      console.error("Error updating ban status", error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      } catch (e: any) {
        toast.error(`Failed to update ban status: ${e.message}`);
      }
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', userId), { 
        role: newRole,
        updatedAt: serverTimestamp()
      });
      toast.success(`User role updated to ${newRole}`);
      setActionMenuOpen(null);
    } catch (error) {
      console.error("Error updating role", error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      } catch (e: any) {
        toast.error(`Failed to update role: ${e.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">User Management</h2>
          <p className="text-muted-foreground text-sm">Monitor and moderate user accounts in real-time.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text" 
            placeholder="Search users by email, name, or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background border-b border-border text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Chats</th>
                <th className="px-6 py-4 font-medium">Messages</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-48 bg-border/50 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-16 bg-border/50 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-12 bg-border/50 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-12 bg-border/50 rounded-md"></div></td>
                    <td className="px-6 py-4"><div className="h-5 w-24 bg-border/50 rounded-md"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-border/50 rounded-md ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No users found matching your search.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    handleToggleAdmin={handleToggleAdmin} 
                    handleToggleBan={handleToggleBan} 
                    actionMenuOpen={actionMenuOpen} 
                    setActionMenuOpen={setActionMenuOpen} 
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
