import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/screens/common/auth/registration/types";

export type SelectModalProps<T> = {
  visible: boolean;
  title: string;
  data: T[];
  keyExtractor: (item: T) => string;
  onClose: () => void;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  /** When provided, a search box is shown and items are filtered by this text */
  searchText?: (item: T) => string;
  searchPlaceholder?: string;
};

export function SelectModal<T>({
  visible,
  title,
  data,
  keyExtractor,
  onClose,
  renderItem,
  onSelect,
  searchText,
  searchPlaceholder = "Search",
}: SelectModalProps<T>) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchText || !q) return data;
    return data.filter((item) => searchText(item).toLowerCase().includes(q));
  }, [data, query, searchText]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleSelect = (item: T) => {
    setQuery("");
    onSelect(item);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.75)",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#202023",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: THEME.cardBorder,
            maxHeight: "75%",
            padding: 16,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#333",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Search */}
          {searchText && (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={THEME.textSub}
              autoCorrect={false}
              style={{
                backgroundColor: THEME.inputBg,
                borderRadius: 25,
                borderWidth: 1,
                borderColor: THEME.inputBorder,
                color: THEME.textWhite,
                fontSize: 14,
                height: 40,
                paddingHorizontal: 16,
                marginBottom: 8,
              }}
            />
          )}

          {/* List */}
          <FlatList
            data={filtered}
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <Text style={{ color: THEME.textSub, fontSize: 13, padding: 12 }}>
                No results found
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleSelect(item)}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#2A2A2E",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                {renderItem(item)}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}