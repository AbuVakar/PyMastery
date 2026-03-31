import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  Dimensions,
  FlatList,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../utils/responsive';
import {
  Container,
  Card,
  Row,
  Col,
  Text as ResponsiveText,
  Icon as ResponsiveIcon,
  Button as ResponsiveButton,
} from '../components/ResponsiveComponents';
import AdvancedCodeExecutionService, { CodeShare } from '../services/advancedCodeExecutionService';

const { width, height } = Dimensions.get('window');

const CodeSharingScreen: React.FC = () => {
  const [myCodeShares, setMyCodeShares] = useState<CodeShare[]>([]);
  const [publicCodeShares, setPublicCodeShares] = useState<CodeShare[]>([]);
  const [selectedShare, setSelectedShare] = useState<CodeShare | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [filterLicense, setFilterLicense] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'views' | 'forks'>('recent');
  const [newShareData, setNewShareData] = useState({
    title: '',
    description: '',
    code: '',
    language: 'python',
    is_public: true,
    tags: [],
    license: 'MIT',
    permissions: {
      allow_comments: true,
      allow_forks: true,
      allow_edits: false,
    },
  });
  const [tagInput, setTagInput] = useState('');
  
  const fadeAnim = new Animated.Value(1);
  const slideAnim = new Animated.Value(0);
  
  const codeSharingService = AdvancedCodeExecutionService.getInstance();
  const { isTablet, fontSize, spacing, iconSize } = useResponsive();

  useEffect(() => {
    loadCodeShares();
  }, []);

  const loadCodeShares = async () => {
    try {
      const [myShares, publicShares] = await Promise.all([
        codeSharingService.getMyCodeShares('current_user'),
        codeSharingService.getPublicCollaborationSessions(50),
      ]);
      
      setMyCodeShares(myShares);
      setPublicCodeShares(publicShares);
    } catch (error: any) {
      console.error('Failed to load code shares:', error);
      Alert.alert('Error', 'Failed to load code shares');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCodeShares();
    setRefreshing(false);
  };

  const createCodeShare = async () => {
    if (!newShareData.title.trim() || !newShareData.code.trim()) {
      Alert.alert('Error', 'Please enter a title and code');
      return;
    }

    try {
      const share = await codeSharingService.createCodeShare(newShareData);
      setMyCodeShares(prev => [share, ...prev]);
      setShowCreateModal(false);
      setNewShareData({
        title: '',
        description: '',
        code: '',
        language: 'python',
        is_public: true,
        tags: [],
        license: 'MIT',
        permissions: {
          allow_comments: true,
          allow_forks: true,
          allow_edits: false,
        },
      });
      setTagInput('');
      
      Alert.alert('Success', 'Code share created successfully!');
    } catch (error: any) {
      console.error('Failed to create code share:', error);
      Alert.alert('Error', error.message || 'Failed to create code share');
    }
  };

  const shareCode = async (share: CodeShare) => {
    try {
      const shareUrl = `https://pymastery.app/share/${share.share_id}`;
      await Share.share({
        message: `Check out this ${share.language} code: ${share.title}\n${shareUrl}`,
        url: shareUrl,
        title: share.title,
      });
    } catch (error: any) {
      console.error('Failed to share code:', error);
      Alert.alert('Error', 'Failed to share code');
    }
  };

  const forkCode = async (share: CodeShare) => {
    try {
      const forkedShare = await codeSharingService.forkCodeShare(share.share_id, 'current_user');
      setMyCodeShares(prev => [forkedShare, ...prev]);
      Alert.alert('Success', 'Code forked successfully!');
    } catch (error: any) {
      console.error('Failed to fork code:', error);
      Alert.alert('Error', error.message || 'Failed to fork code');
    }
  };

  const deleteCodeShare = async (shareId: string) => {
    Alert.alert(
      'Delete Code Share',
      'Are you sure you want to delete this code share?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await codeSharingService.deleteCodeShare(shareId);
              setMyCodeShares(prev => prev.filter(s => s.share_id !== shareId));
              Alert.alert('Success', 'Code share deleted successfully!');
            } catch (error: any) {
              console.error('Failed to delete code share:', error);
              Alert.alert('Error', error.message || 'Failed to delete code share');
            }
          },
        },
      ]
    );
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !newShareData.tags.includes(tag)) {
      setNewShareData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewShareData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const getFilteredShares = () => {
    let filtered = publicCodeShares;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(share => 
        share.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        share.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        share.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by language
    if (filterLanguage !== 'all') {
      filtered = filtered.filter(share => share.language === filterLanguage);
    }

    // Filter by license
    if (filterLicense !== 'all') {
      filtered = filtered.filter(share => share.license === filterLicense);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          return b.analytics.views - a.analytics.views;
        case 'views':
          return b.analytics.views - a.analytics.views;
        case 'forks':
          return b.analytics.forks - a.analytics.forks;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const getLicenseColor = (license: string) => {
    switch (license) {
      case 'MIT': return '#4CAF50';
      case 'Apache-2.0': return '#2196F3';
      case 'GPL-3.0': return '#FF9800';
      case 'BSD-3-Clause': return '#9C27B0';
      case 'ISC': return '#F44336';
      default: return '#666';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const CodeShareCard = ({ share, showActions = true }: { share: CodeShare; showActions?: boolean }) => (
    <TouchableOpacity
      style={styles.shareCard}
      onPress={() => {
        setSelectedShare(share);
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.shareHeader}>
        <ResponsiveText variant="lg" style={styles.shareTitle}>
          {share.title}
        </ResponsiveText>
        <View style={[styles.licenseBadge, { backgroundColor: getLicenseColor(share.license) }]}>
          <ResponsiveText variant="xs" style={styles.licenseText}>
            {share.license}
          </ResponsiveText>
        </View>
      </View>

      {share.description && (
        <ResponsiveText variant="sm" style={styles.shareDescription}>
          {share.description}
        </ResponsiveText>
      )}

      <View style={styles.shareMeta}>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="code-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {share.language}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="eye-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {formatNumber(share.analytics.views)}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="git-branch-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {formatNumber(share.analytics.forks)}
          </ResponsiveText>
        </View>
        <View style={styles.metaItem}>
          <ResponsiveIcon name="time-outline" size="sm" color="#666" />
          <ResponsiveText variant="xs" style={styles.metaText}>
            {new Date(share.created_at).toLocaleDateString()}
          </ResponsiveText>
        </View>
      </View>

      {share.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {share.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <ResponsiveText variant="xs" style={styles.tagText}>
                #{tag}
              </ResponsiveText>
            </View>
          ))}
          {share.tags.length > 3 && (
            <View style={styles.tag}>
              <ResponsiveText variant="xs" style={styles.tagText}>
                +{share.tags.length - 3}
              </ResponsiveText>
            </View>
          )}
        </View>
      )}

      {showActions && (
        <View style={styles.shareActions}>
          <ResponsiveButton variant="outline" style={styles.actionButton} onPress={() => shareCode(share)}>
            <ResponsiveIcon name="share-outline" size="sm" />
            <ResponsiveText variant="xs">Share</ResponsiveText>
          </ResponsiveButton>
          <ResponsiveButton variant="outline" style={styles.actionButton} onPress={() => forkCode(share)}>
            <ResponsiveIcon name="git-branch-outline" size="sm" />
            <ResponsiveText variant="xs">Fork</ResponsiveText>
          </ResponsiveButton>
          <ResponsiveButton variant="outline" style={styles.actionButton} onPress={() => Linking.openURL(`https://pymastery.app/share/${share.share_id}`)}>
            <ResponsiveIcon name="open-outline" size="sm" />
            <ResponsiveText variant="xs">Open</ResponsiveText>
          </ResponsiveButton>
        </View>
      )}
    </TouchableOpacity>
  );

  const CreateShareModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Create Code Share
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        <ScrollView style={styles.modalContent}>
          <Card shadow padding={spacing.md} margin={spacing.sm}>
            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Title
              </ResponsiveText>
              <TextInput
                style={styles.textInput}
                placeholder="Enter a descriptive title"
                value={newShareData.title}
                onChangeText={(text) => setNewShareData(prev => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Description
              </ResponsiveText>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your code (optional)"
                value={newShareData.description}
                onChangeText={(text) => setNewShareData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Code
              </ResponsiveText>
              <TextInput
                style={[styles.textInput, styles.codeInput]}
                placeholder="Paste your code here"
                value={newShareData.code}
                onChangeText={(text) => setNewShareData(prev => ({ ...prev, code: text }))}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                fontFamily="monospace"
              />
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Language
              </ResponsiveText>
              <View style={styles.languageSelector}>
                {['python', 'javascript', 'java', 'cpp', 'c', 'rust', 'go', 'typescript'].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[
                      styles.languageOption,
                      newShareData.language === lang && styles.languageOptionSelected,
                    ]}
                    onPress={() => setNewShareData(prev => ({ ...prev, language: lang }))}
                  >
                    <ResponsiveText
                      variant="sm"
                      style={[
                        styles.languageOptionText,
                        newShareData.language === lang && styles.languageOptionTextSelected,
                      ]}
                    >
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </ResponsiveText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Tags
              </ResponsiveText>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                  <ResponsiveIcon name="add-outline" size="sm" />
                </TouchableOpacity>
              </View>
              {newShareData.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {newShareData.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <ResponsiveText variant="xs" style={styles.tagText}>
                        #{tag}
                      </ResponsiveText>
                      <TouchableOpacity onPress={() => removeTag(tag)}>
                        <ResponsiveIcon name="close-outline" size="xs" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                License
              </ResponsiveText>
              <View style={styles.licenseSelector}>
                {['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC'].map((license) => (
                  <TouchableOpacity
                    key={license}
                    style={[
                      styles.licenseOption,
                      newShareData.license === license && styles.licenseOptionSelected,
                    ]}
                    onPress={() => setNewShareData(prev => ({ ...prev, license }))}
                  >
                    <ResponsiveText
                      variant="xs"
                      style={[
                        styles.licenseOptionText,
                        newShareData.license === license && styles.licenseOptionTextSelected,
                      ]}
                    >
                      {license}
                    </ResponsiveText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <ResponsiveText variant="md" style={styles.formLabel}>
                Permissions
              </ResponsiveText>
              <View style={styles.permissionsContainer}>
                <View style={styles.permissionRow}>
                  <ResponsiveText variant="sm">Allow Comments</ResponsiveText>
                  <TouchableOpacity
                    style={[styles.switch, newShareData.permissions.allow_comments && styles.switchActive]}
                    onPress={() => setNewShareData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, allow_comments: !prev.permissions.allow_comments }
                    }))}
                  >
                    <View style={styles.switchThumb} />
                  </TouchableOpacity>
                </View>
                <View style={styles.permissionRow}>
                  <ResponsiveText variant="sm">Allow Forks</ResponsiveText>
                  <TouchableOpacity
                    style={[styles.switch, newShareData.permissions.allow_forks && styles.switchActive]}
                    onPress={() => setNewShareData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, allow_forks: !prev.permissions.allow_forks }
                    }))}
                  >
                    <View style={styles.switchThumb} />
                  </TouchableOpacity>
                </View>
                <View style={styles.permissionRow}>
                  <ResponsiveText variant="sm">Allow Edits</ResponsiveText>
                  <TouchableOpacity
                    style={[styles.switch, newShareData.permissions.allow_edits && styles.switchActive]}
                    onPress={() => setNewShareData(prev => ({
                      ...prev,
                      permissions: { ...prev.permissions, allow_edits: !prev.permissions.allow_edits }
                    }))}
                  >
                    <View style={styles.switchThumb} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <ResponsiveButton
              variant="primary"
              style={styles.createButton}
              onPress={createCodeShare}
            >
              <ResponsiveIcon name="share-outline" size="md" />
              <ResponsiveText variant="sm">Create Share</ResponsiveText>
            </ResponsiveButton>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const DetailsModal = () => (
    <Modal
      visible={showDetailsModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowDetailsModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
            <ResponsiveIcon name="close" size="lg" />
          </TouchableOpacity>
          <ResponsiveText variant="lg" style={styles.modalTitle}>
            Code Details
          </ResponsiveText>
          <View style={styles.modalSpacer} />
        </View>

        {selectedShare && (
          <ScrollView style={styles.modalContent}>
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.detailsHeader}>
                <ResponsiveText variant="lg" style={styles.detailsTitle}>
                  {selectedShare.title}
                </ResponsiveText>
                <View style={[styles.licenseBadge, { backgroundColor: getLicenseColor(selectedShare.license) }]}>
                  <ResponsiveText variant="xs" style={styles.licenseText}>
                    {selectedShare.license}
                  </ResponsiveText>
                </View>
              </View>

              {selectedShare.description && (
                <ResponsiveText variant="sm" style={styles.detailsDescription}>
                  {selectedShare.description}
                </ResponsiveText>
              )}

              <View style={styles.detailsMeta}>
                <ResponsiveText variant="sm" style={styles.detailsMetaLabel}>
                  Language: {selectedShare.language}
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.detailsMetaLabel}>
                  Created: {new Date(selectedShare.created_at).toLocaleDateString()}
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.detailsMetaLabel}>
                  Views: {formatNumber(selectedShare.analytics.views)}
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.detailsMetaLabel}>
                  Forks: {formatNumber(selectedShare.analytics.forks)}
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.detailsMetaLabel}>
                  Runs: {formatNumber(selectedShare.analytics.runs)}
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.detailsMetaLabel}>
                  Shares: {formatNumber(selectedShare.analytics.shares)}
                </ResponsiveText>
              </View>

              {selectedShare.tags.length > 0 && (
                <View style={styles.detailsTags}>
                  <ResponsiveText variant="sm" style={styles.detailsTagsLabel}>
                    Tags:
                  </ResponsiveText>
                  <View style={styles.tagsContainer}>
                    {selectedShare.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <ResponsiveText variant="xs" style={styles.tagText}>
                          #{tag}
                        </ResponsiveText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.codePreview}>
                <ResponsiveText variant="sm" style={styles.codeLabel}>
                  Code Preview:
                </ResponsiveText>
                <Text style={styles.codeText}>
                  {selectedShare.code.substring(0, 500)}
                  {selectedShare.code.length > 500 && '...'}
                </Text>
              </View>

              <View style={styles.detailsActions}>
                <ResponsiveButton variant="primary" style={styles.detailsButton} onPress={() => shareCode(selectedShare)}>
                  <ResponsiveIcon name="share-outline" size="md" />
                  <ResponsiveText variant="sm">Share</ResponsiveText>
                </ResponsiveButton>
                <ResponsiveButton variant="outline" style={styles.detailsButton} onPress={() => forkCode(selectedShare)}>
                  <ResponsiveIcon name="git-branch-outline" size="md" />
                  <ResponsiveText variant="sm">Fork</ResponsiveText>
                </ResponsiveButton>
                <ResponsiveButton variant="outline" style={styles.detailsButton} onPress={() => Linking.openURL(`https://pymastery.app/share/${selectedShare.share_id}`)}>
                  <ResponsiveIcon name="open-outline" size="md" />
                  <ResponsiveText variant="sm">Open</ResponsiveText>
                </ResponsiveButton>
              </View>
            </Card>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <Container padding margin>
      <ScrollView
        refreshControl={
          <ScrollView refreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ResponsiveText variant="xxxl" style={styles.title}>
            Code Sharing
          </ResponsiveText>
          <ResponsiveText variant="md" style={styles.subtitle}>
            Share and discover code with the community
          </ResponsiveText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <ResponsiveButton
            variant="primary"
            style={styles.actionButton}
            onPress={() => setShowCreateModal(true)}
          >
            <ResponsiveIcon name="add-outline" size="md" />
            <ResponsiveText variant="sm">Create Share</ResponsiveText>
          </ResponsiveButton>
          <ResponsiveButton
            variant="outline"
            style={styles.actionButton}
            onPress={() => Linking.openURL('https://pymastery.app/explore')}
          >
            <ResponsiveIcon name="compass-outline" size="md" />
            <ResponsiveText variant="sm">Explore</ResponsiveText>
          </ResponsiveButton>
        </View>

        {/* Search and Filters */}
        <Card shadow padding={spacing.md} margin={spacing.sm}>
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search code shares..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton}>
              <ResponsiveIcon name="search" size="md" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterRow}>
              <ResponsiveText variant="sm" style={styles.filterLabel}>
                Language:
              </ResponsiveText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtons}>
                  {['all', 'python', 'javascript', 'java', 'cpp', 'c', 'rust', 'go'].map((lang) => (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.filterButton,
                        filterLanguage === lang && styles.filterButtonActive,
                      ]}
                      onPress={() => setFilterLanguage(lang)}
                    >
                      <ResponsiveText
                        variant="xs"
                        style={[
                          styles.filterButtonText,
                          filterLanguage === lang && styles.filterButtonTextActive,
                        ]}
                      >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </ResponsiveText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.filterRow}>
              <ResponsiveText variant="sm" style={styles.filterLabel}>
                Sort:
              </ResponsiveText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterButtons}>
                  {[
                    { key: 'recent', label: 'Recent' },
                    { key: 'popular', label: 'Popular' },
                    { key: 'views', label: 'Views' },
                    { key: 'forks', label: 'Forks' },
                  ].map((sort) => (
                    <TouchableOpacity
                      key={sort.key}
                      style={[
                        styles.filterButton,
                        sortBy === sort.key && styles.filterButtonActive,
                      ]}
                      onPress={() => setSortBy(sort.key as any)}
                    >
                      <ResponsiveText
                        variant="xs"
                        style={[
                          styles.filterButtonText,
                          sortBy === sort.key && styles.filterButtonTextActive,
                        ]}
                      >
                        {sort.label}
                      </ResponsiveText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Card>

        {/* My Code Shares */}
        <View style={styles.section}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            My Code Shares ({myCodeShares.length})
          </ResponsiveText>
          
          {myCodeShares.length > 0 ? (
            myCodeShares.map((share) => (
              <CodeShareCard key={share.share_id} share={share} />
            ))
          ) : (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.emptyState}>
                <ResponsiveIcon name="code-outline" size="lg" color="#ccc" />
                <ResponsiveText variant="md" style={styles.emptyStateText}>
                  No code shares yet
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.emptyStateSubtext}>
                  Create your first code share to get started
                </ResponsiveText>
              </View>
            </Card>
          )}
        </View>

        {/* Public Code Shares */}
        <View style={styles.section}>
          <ResponsiveText variant="lg" style={styles.sectionTitle}>
            Public Code Shares ({getFilteredShares().length})
          </ResponsiveText>
          
          {getFilteredShares().length > 0 ? (
            getFilteredShares().map((share) => (
              <CodeShareCard key={share.share_id} share={share} />
            ))
          ) : (
            <Card shadow padding={spacing.md} margin={spacing.sm}>
              <View style={styles.emptyState}>
                <ResponsiveIcon name="search-outline" size="lg" color="#ccc" />
                <ResponsiveText variant="md" style={styles.emptyStateText}>
                  No code shares found
                </ResponsiveText>
                <ResponsiveText variant="sm" style={styles.emptyStateSubtext}>
                  Try adjusting your search or filters
                </ResponsiveText>
              </View>
            </Card>
          )}
        </View>

        {/* Modals */}
        <CreateShareModal />
        <DetailsModal />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  filterSection: {
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterLabel: {
    fontWeight: '600',
    color: '#333',
    minWidth: 80,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 5,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  shareCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareTitle: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  licenseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  licenseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  shareDescription: {
    color: '#666',
    marginBottom: 10,
  },
  shareMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: '#666',
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  tagText: {
    color: '#007AFF',
    fontSize: 12,
  },
  shareActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyStateText: {
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalSpacer: {
    width: 24,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  codeInput: {
    height: 120,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
  languageSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  languageOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f5f5f5',
  },
  languageOptionSelected: {
    backgroundColor: '#007AFF',
  },
  languageOptionText: {
    color: '#666',
  },
  languageOptionTextSelected: {
    color: '#fff',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  addTagButton: {
    padding: 10,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  licenseSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  licenseOption: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  licenseOptionSelected: {
    backgroundColor: '#007AFF',
  },
  licenseOptionText: {
    color: '#666',
    fontSize: 12,
  },
  licenseOptionTextSelected: {
    color: '#fff',
  },
  permissionsContainer: {
    gap: 10,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switch: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ccc',
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: '#007AFF',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    marginLeft: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailsTitle: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  detailsDescription: {
    color: '#666',
    marginBottom: 15,
  },
  detailsMeta: {
    gap: 5,
    marginBottom: 15,
  },
  detailsMetaLabel: {
    color: '#666',
  },
  detailsTags: {
    marginBottom: 15,
  },
  detailsTagsLabel: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  codePreview: {
    marginBottom: 15,
  },
  codeLabel: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  codeText: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  detailsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsButton: {
    flex: 1,
    margin: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
});

export default CodeSharingScreen;
