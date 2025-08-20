import { getVolume, setVolume, getMute, setMute } from '../src/index.js';

async function demo() {
  try {
    console.log('=== x-vol 動作確認デモ（出力デバイス） ===\n');
    
    // 現在の音量とミュート状態を取得（出力デバイス）
    console.log('出力デバイスの現在の状態を取得中...');
    const currentOutputVolume = await getVolume('output');
    const currentOutputMute = await getMute('output');
    
    console.log(`出力音量: ${currentOutputVolume}%`);
    console.log(`出力ミュート状態: ${currentOutputMute ? 'ミュート中' : 'ミュート解除'}\n`);
    
    // 音量を少し変更してテスト
    console.log('出力音量を50%に設定...');
    await setVolume('output', 50);
    const newOutputVolume = await getVolume('output');
    console.log(`新しい出力音量: ${newOutputVolume}%\n`);
    
    // ミュート状態をテスト
    console.log('出力ミュートをテスト...');
    await setMute('output', true);
    const outputMuteStatus = await getMute('output');
    console.log(`出力ミュート状態: ${outputMuteStatus ? 'ミュート中' : 'ミュート解除'}`);
    
    // 2秒待機
    console.log('2秒待機...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ミュート解除
    console.log('出力ミュート解除...');
    await setMute('output', false);
    const outputUnmuteStatus = await getMute('output');
    console.log(`出力ミュート状態: ${outputUnmuteStatus ? 'ミュート中' : 'ミュート解除'}\n`);
    
    // 元の音量に戻す
    console.log(`元の出力音量(${currentOutputVolume}%)に戻します...`);
    await setVolume('output', currentOutputVolume);
    const finalOutputVolume = await getVolume('output');
    console.log(`最終出力音量: ${finalOutputVolume}%\n`);
    
    console.log('=== 入力デバイス（マイク）のテスト ===\n');
    
    // 現在の音量とミュート状態を取得（入力デバイス）
    console.log('入力デバイスの現在の状態を取得中...');
    const currentInputVolume = await getVolume('input');
    const currentInputMute = await getMute('input');
    
    console.log(`入力音量: ${currentInputVolume}%`);
    console.log(`入力ミュート状態: ${currentInputMute ? 'ミュート中' : 'ミュート解除'}\n`);
    
    // 入力音量を変更してテスト
    console.log('入力音量を75%に設定...');
    await setVolume('input', 75);
    const newInputVolume = await getVolume('input');
    console.log(`新しい入力音量: ${newInputVolume}%\n`);
    
    // 元の音量に戻す
    console.log(`元の入力音量(${currentInputVolume}%)に戻します...`);
    await setVolume('input', currentInputVolume);
    const finalInputVolume = await getVolume('input');
    console.log(`最終入力音量: ${finalInputVolume}%`);
    
    console.log('\n✅ すべての機能が正常に動作しました！');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

demo();