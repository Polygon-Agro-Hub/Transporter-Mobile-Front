import React from "react";
import { View } from "react-native";

interface PdfViewerProps {
  uri: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ uri }) => {
  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <iframe
        src={uri}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="PDF Preview"
      />
    </View>
  );
};

export default PdfViewer;
