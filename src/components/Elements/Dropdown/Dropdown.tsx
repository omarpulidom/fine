import { Colors } from "@/components/colors";
import { CaretUpIcon, CaretDownIcon, CheckIcon } from "phosphor-react-native";
import { useState, useRef, useEffect } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface SelectOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  error?: boolean;
  className?: string;
}

function Dropdown({
  options,
  value,
  onValueChange,
  placeholder,
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonLayout, setButtonLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const buttonRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  const handleOpen = () => {
    buttonRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setButtonLayout({ x: pageX, y: pageY, width, height });
      setIsOpen(true);
    });
  };

  // Auto-scroll to selected option when dropdown opens
  useEffect(() => {
    if (isOpen && selectedIndex >= 0 && scrollViewRef.current) {
      setTimeout(() => {
        const itemHeight = 40;
        const scrollToY = selectedIndex * itemHeight;
        scrollViewRef.current?.scrollTo({ y: scrollToY, animated: true });
      }, 100);
    }
  }, [isOpen, selectedIndex]);

  return (
    <>
      {/* Select Button */}
      <View ref={buttonRef} collapsable={false} className={className}>
        <TouchableOpacity
          onPress={handleOpen}
          className={"px-3 py-2 rounded-full gap-1 bg-secondary-900"}
          activeOpacity={0.7}
        >
          <View className="items-center flex-row gap-1">
            <Text
              className={
                "flex-1 text-[13px] text-center font-montserrat-regular text-light-800"
              }
            >
              {selectedOption ? selectedOption.label : placeholder}
            </Text>
            {isOpen ? (
              <CaretUpIcon
                size={18}
                color={Colors.secondary[500]}
                weight="bold"
              />
            ) : (
              <CaretDownIcon
                size={18}
                color={Colors.secondary[500]}
                weight="bold"
              />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setIsOpen(false)}
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          <Animated.View
            entering={FadeInDown.duration(200)}
            style={{
              position: "absolute",
              top: buttonLayout.y + buttonLayout.height + 8,
              left: buttonLayout.x,
              width: buttonLayout.width,
              maxHeight: 240,
            }}
            className="bg-secondary-900 border border-secondary-700 rounded-xl shadow-2xl overflow-hidden"
          >
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              className="py-1"
              bounces={false}
            >
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-3 flex-row items-center justify-between ${
                    index !== options.length - 1
                      ? "border-b border-secondary-700"
                      : ""
                  }`}
                  activeOpacity={0.6}
                >
                  <Text
                    className={
                      "flex-1 text-[13px] text-center font-montserrat-regular text-light-800"
                    }
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

export default Dropdown;
